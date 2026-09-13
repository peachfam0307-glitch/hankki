import UIKit
import UniformTypeIdentifiers

/// 🍎 한끼 Share Extension (2026-09-13)
/// 공유 시트에서 「한끼」를 고르면 여기로 온다. 받은 사진·링크·글을 App Group 저장칸의 inbox 에 «파일로» 남기고 끝낸다.
/// 한끼 앱이 열릴 때(어떤 길이든) ShareIntakePlugin.consume 이 그 inbox 를 꺼내 임시보관함에 담는다.
///
/// ⛔ Apple 원문(open(_:completionHandler:) · ExtensionOverview · 포럼 764570 DTS 답변, 2026-09-13 열람):
///    공유 부품은 앱을 «직접 열 수 없다». 그래서 본선은 「저장 → 앱이 열리면 꺼냄」이고,
///    아래 openHost 는 «되면 좋은 보너스»다(실패해도 데이터는 inbox 에 남는다).
/// ⛔ Capacitor 를 import 하지 않는다 — APPLICATION_EXTENSION_API_ONLY=YES.
final class ShareViewController: UIViewController {
    static let appGroup = "group.kr.hankki.app"
    static let scheme = "hankki"

    private let label = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        label.text = "한끼에 담는 중…"
        label.textAlignment = .center
        label.font = .systemFont(ofSize: 17, weight: .semibold)
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
        Task { await ingest() }
    }

    // 메인 액터에서 돈다 — extensionContext·응답자 체인·UIKit 은 메인에서만. 파일 복사는 provider 콜백(백그라운드) 안에서 한다.
    @MainActor private func ingest() async {
        guard let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: Self.appGroup) else {
            label.text = "담지 못했어요"
            finish(); return
        }
        let ts = Int(Date().timeIntervalSince1970 * 1000)
        let dir = container.appendingPathComponent("inbox/\(ts)-\(UUID().uuidString.prefix(8))", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)

        var title = "", text = "", url = ""
        var images: [String] = []
        let items = (extensionContext?.inputItems as? [NSExtensionItem]) ?? []
        for item in items {
            if title.isEmpty, let t = item.attributedTitle?.string { title = t }
            if text.isEmpty, let t = item.attributedContentText?.string { text = t }
            for p in item.attachments ?? [] {
                if p.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                    if let src = await loadFile(p, UTType.image.identifier) {
                        let ext = src.pathExtension.isEmpty ? "jpg" : src.pathExtension
                        let dst = dir.appendingPathComponent("image-\(images.count).\(ext)")
                        do { try FileManager.default.copyItem(at: src, to: dst); images.append(dst.lastPathComponent) } catch { /* 이 장은 건너뛴다 */ }
                        try? FileManager.default.removeItem(at: src)
                    }
                } else if p.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    if url.isEmpty { url = Self.asURL(await loadItem(p, UTType.url.identifier)) }
                } else if p.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    if text.isEmpty { text = Self.asText(await loadItem(p, UTType.plainText.identifier)) }
                }
            }
        }
        // 안드로이드 share_target(sw.js) 의 meta 와 «같은 열쇠 이름» — 앱의 담기 코드를 그대로 쓰기 위해.
        let meta: [String: Any] = [
            "title": title, "text": text, "url": url, "ts": ts,
            "hasImage": !images.isEmpty, "imageCount": images.count, "images": images,
        ]
        if let data = try? JSONSerialization.data(withJSONObject: meta) {
            try? data.write(to: dir.appendingPathComponent("meta.json"), options: .atomic)
        }
        label.text = "한끼에 담았어요 · 한끼를 열면 보여요"
        // ⛔ [2026-09-13 22:2x · 17판 딸 폰 실물] 여기서 응답자 체인으로 앱을 깨우던 «보너스»(openHost)를 «뺐다».
        //    영상 = 공유 시트에 「한끼」가 뜨고 → 누르면 1초 어두워졌다가 → 공유 시트로 되돌아옴(닫히지 않음).
        //    = completeRequest 전에 죽은 모양. 비공식 셀렉터 호출이 확장 프로세스에서 예외를 낼 수 있다(포럼 764570 도 «동작 보고»일 뿐).
        //    ⭐ 본선은 원래 「저장 → 앱이 열릴 때 꺼냄」이라 이 줄 없이도 기능은 그대로다(Apple 원문대로).
        finish()
    }

    // loadFileRepresentation 이 주는 임시 파일은 콜백이 끝나면 지워진다 → 콜백 «안에서» 우리 임시 폴더로 복사한다.
    private func loadFile(_ p: NSItemProvider, _ type: String) async -> URL? {
        await withCheckedContinuation { c in
            _ = p.loadFileRepresentation(forTypeIdentifier: type) { u, _ in
                guard let u else { c.resume(returning: nil); return }
                let tmp = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + "." + u.pathExtension)
                try? FileManager.default.copyItem(at: u, to: tmp)
                c.resume(returning: FileManager.default.fileExists(atPath: tmp.path) ? tmp : nil)
            }
        }
    }

    // loadItem 은 앱마다 URL/NSString/Data 로 다르게 준다 — 셋 다 받는다(빈 문자열 = 없음).
    private static func asURL(_ v: Any?) -> String {
        if let u = v as? URL { return u.absoluteString }
        if let s = v as? String { return s }
        if let d = v as? Data { return URL(dataRepresentation: d, relativeTo: nil)?.absoluteString ?? (String(data: d, encoding: .utf8) ?? "") }
        return ""
    }
    private static func asText(_ v: Any?) -> String {
        if let s = v as? String { return s }
        if let a = v as? NSAttributedString { return a.string }
        if let d = v as? Data { return String(data: d, encoding: .utf8) ?? "" }
        return ""
    }

    private func loadItem(_ p: NSItemProvider, _ type: String) async -> Any? {
        await withCheckedContinuation { c in
            p.loadItem(forTypeIdentifier: type, options: nil) { v, _ in c.resume(returning: v) }
        }
    }

    // 🗑 [2026-09-13] 응답자 체인으로 hankki://share 를 여는 비공식 코드(openHost)는 «지웠다» — 17판 실물에서 그 자리에서 죽는 모양이었고,
    //    Apple 원문대로 공유 부품은 앱을 못 연다. 되살릴 땐 git 이력(17판 커밋)에 있다. ⛔되살리기 전에 실기기에서 먼저 잰다.

    private func finish() {
        // 1.5초 = 「담았어요」를 눈으로 읽을 시간(창업자 *"반응이 없엉"* — 0.6초는 깜빡임으로 보인다)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }
}

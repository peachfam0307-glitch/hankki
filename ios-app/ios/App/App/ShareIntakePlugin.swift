import Foundation
import Capacitor

/// 🍎 앱 쪽 다리 (2026-09-13) — Share Extension 이 App Group inbox 에 남긴 것을 웹(App.jsx)에 넘긴다.
/// 웹에서는 window.Capacitor.Plugins.ShareIntake.consume() / addListener('shareReceived') 로 부른다 (src/iosShare.js).
/// Capacitor 6+ 는 로컬 플러그인을 자동 등록하지 않는다 → HankkiViewController.capacitorDidLoad 에서 registerPluginInstance.
@objc(ShareIntakePlugin)
public class ShareIntakePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ShareIntakePlugin"
    public let jsName = "ShareIntake"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "consume", returnType: CAPPluginReturnPromise),
    ]
    static let appGroup = "group.kr.hankki.app"

    // AppPlugin 과 같은 방식 — SceneDelegateProxy 가 쏘는 .capacitorOpenURL 을 듣는다.
    override public func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(onOpenURL(_:)), name: .capacitorOpenURL, object: nil)
    }

    @objc private func onOpenURL(_ n: NSNotification) {
        guard let o = n.object as? [String: Any], let url = o["url"] as? URL,
              url.scheme == "hankki", url.host == "share" else { return }
        notifyListeners("shareReceived", data: ["ts": url.query ?? ""], retainUntilConsumed: true)
    }

    /// inbox 의 항목을 오래된 것부터 전부 돌려주고 지운다. 사진은 data URL(안드로이드 shareIntake.js 와 같은 모양).
    @objc func consume(_ call: CAPPluginCall) {
        guard let base = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: Self.appGroup)?
                .appendingPathComponent("inbox", isDirectory: true),
              let dirs = try? FileManager.default.contentsOfDirectory(at: base, includingPropertiesForKeys: nil) else {
            call.resolve(["items": []]); return
        }
        var items: [[String: Any]] = []
        for d in dirs.sorted(by: { $0.lastPathComponent < $1.lastPathComponent }) {
            guard let data = try? Data(contentsOf: d.appendingPathComponent("meta.json")),
                  var meta = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
                try? FileManager.default.removeItem(at: d); continue
            }
            let names = (meta["images"] as? [String]) ?? []
            meta["imageDataUrls"] = names.compactMap { n -> String? in
                guard let bytes = try? Data(contentsOf: d.appendingPathComponent(n)) else { return nil }
                let low = n.lowercased()
                let mime = low.hasSuffix(".png") ? "image/png" : (low.hasSuffix(".heic") ? "image/heic" : "image/jpeg")
                return "data:\(mime);base64," + bytes.base64EncodedString()
            }
            meta.removeValue(forKey: "images")
            items.append(meta)
            try? FileManager.default.removeItem(at: d)
        }
        call.resolve(["items": items])
    }
}

import Foundation
import Capacitor
import StoreKit

/// 🍎💳 아이폰 결제 다리 (2026-10-22) — StoreKit 2 를 얇게 감싼다. 웹(src/billing.js)이 window.Capacitor.Plugins.HankkiStore 로 부른다.
/// ⭐ 설계 = docs/결제-여는-순서 10/22 「아이폰 설계 검토」 — 확인은 워커가 «애플 서버에 다시 묻기»로 한다.
///    그래서 여기서는 «거래 번호»만 넘긴다. 서명된 거래를 웹으로 안 넘긴다(서버가 안 믿으니까).
/// ⛔ finish() 는 웹이 «서버가 열쇠를 넣었다»는 답을 받은 «뒤»에만 부른다 — 먼저 끝내면 서버가 죽었을 때 돈만 나간다.
///    안 끝낸 거래는 앱을 켤 때마다 unfinished 로 다시 나온다 → 웹이 다시 보낸다(서버는 같은 거래를 한 번만 받는다).
/// Capacitor 6+ 는 로컬 플러그인을 자동 등록하지 않는다 → HankkiViewController.capacitorDidLoad 에서 registerPluginInstance.
@objc(HankkiStorePlugin)
public class HankkiStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HankkiStorePlugin"
    public let jsName = "HankkiStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unfinished", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise),
    ]
    private var updates: Task<Void, Never>?

    /// 결제 창 밖에서 생긴 거래(가족 승인 대기 뒤 승인 · 다른 기기 등)를 웹에 알린다.
    override public func load() {
        updates = Task.detached { [weak self] in
            for await r in Transaction.updates {
                if case .verified(let t) = r {
                    self?.notifyListeners("transaction", data: ["id": String(t.id)], retainUntilConsumed: true)
                }
            }
        }
    }

    deinit { updates?.cancel() }

    /// 상품 정보 — 가격은 «애플이 준 글자» 그대로(나라·환율이 붙는다 · 우리가 990원이라고 박지 않는다).
    @objc func products(_ call: CAPPluginCall) {
        let ids = (call.getArray("ids") ?? []).compactMap { $0 as? String }
        Task {
            do {
                let ps = try await Product.products(for: ids)
                call.resolve(["products": ps.map { ["id": $0.id, "price": $0.displayPrice, "title": $0.displayName] }])
            } catch {
                call.reject("products_failed")
            }
        }
    }

    /// 사기 — 돌려주는 값 = { status: success|cancel|pending|unverified|fail, id? }
    /// ⛔ 여기서 finish 하지 않는다.
    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("no_id"); return }
        Task {
            do {
                guard let p = try await Product.products(for: [id]).first else { call.resolve(["status": "fail"]); return }
                let r = try await p.purchase()
                switch r {
                case .success(let v):
                    switch v {
                    case .verified(let t): call.resolve(["status": "success", "id": String(t.id)])
                    case .unverified(let t, _): call.resolve(["status": "unverified", "id": String(t.id)])
                    }
                case .userCancelled: call.resolve(["status": "cancel"])
                case .pending: call.resolve(["status": "pending"])
                @unknown default: call.resolve(["status": "fail"])
                }
            } catch {
                call.resolve(["status": "fail"])
            }
        }
    }

    /// 아직 안 끝낸 거래 번호들 — 앱을 켤 때 웹이 서버로 다시 보낸다(돈 내고 못 받는 길을 막는다).
    @objc func unfinished(_ call: CAPPluginCall) {
        Task {
            var ids: [String] = []
            for await r in Transaction.unfinished {
                if case .verified(let t) = r { ids.append(String(t.id)) }
            }
            call.resolve(["ids": ids])
        }
    }

    /// 끝내기 — 서버가 열쇠를 넣었다고 답한 «뒤»에만.
    @objc func finish(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("no_id"); return }
        Task {
            var 끝냄 = false
            for await r in Transaction.unfinished {
                if case .verified(let t) = r, String(t.id) == id {
                    await t.finish()
                    끝냄 = true
                }
            }
            call.resolve(["finished": 끝냄])
        }
    }
}

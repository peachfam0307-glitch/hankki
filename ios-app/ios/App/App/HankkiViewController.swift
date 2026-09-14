import UIKit
import Capacitor

/// Capacitor 6+ 는 npm 플러그인만 자동 등록한다(capacitor.config.json packageClassList).
/// 우리 로컬 플러그인(ShareIntake)은 여기서 손으로 등록한다 — registerPluginInstance 가 JS 쪽 window.Capacitor.Plugins 까지 만든다.
final class HankkiViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(ShareIntakePlugin())
    }
}

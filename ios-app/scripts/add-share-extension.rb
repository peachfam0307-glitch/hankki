# ios-app/scripts/add-share-extension.rb — 「한끼」 Share Extension 타깃을 Xcode 없이 pbxproj 에 심는다 (xcodeproj gem)
require 'xcodeproj'
proj_path = ARGV[0] || 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(proj_path)
app = project.targets.find { |t| t.name == 'App' } or abort 'App target not found'
abort 'ShareExtension already exists' if project.targets.any? { |t| t.name == 'ShareExtension' }

ext = project.new_target(:app_extension, 'ShareExtension', :ios, '15.0', project.products_group, :swift)
# new_target 이 SDK 경로가 박힌 Foundation.framework 참조를 넣는다 — Swift 는 자동 링크라 빼 버린다
ext.frameworks_build_phase.files.dup.each { |bf| ref = bf.file_ref; bf.remove_from_project; ref.remove_from_project if ref }
fw = project.main_group['Frameworks']; fw.remove_from_project if fw && fw.empty?

# 소스·리소스 그룹 = ios/App/ShareExtension/ 폴더
grp = project.main_group.new_group('ShareExtension', 'ShareExtension')
src = grp.new_file('ShareViewController.swift')
grp.new_file('Info.plist')
grp.new_file('ShareExtension.entitlements')
ext.add_file_references([src])

# 호스트 App 타깃에 새 Swift 둘(ShareIntakePlugin · HankkiViewController) 추가
app_grp = project.main_group['App']
app.add_file_references([app_grp.new_file('ShareIntakePlugin.swift'), app_grp.new_file('HankkiViewController.swift')])

ext.build_configurations.each do |c|
  s = c.build_settings
  host = app.build_configurations.find { |ac| ac.name == c.name }.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER']      = 'kr.hankki.app.share'
  s['INFOPLIST_FILE']                 = 'ShareExtension/Info.plist'
  s['GENERATE_INFOPLIST_FILE']        = 'NO'
  s['CODE_SIGN_ENTITLEMENTS']         = 'ShareExtension/ShareExtension.entitlements'
  s['PRODUCT_NAME']                   = '$(TARGET_NAME)'
  s['SWIFT_VERSION']                  = '5.0'
  s['IPHONEOS_DEPLOYMENT_TARGET']     = '15.0'
  s['TARGETED_DEVICE_FAMILY']         = '1,2'
  s['SKIP_INSTALL']                   = 'YES'
  s['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
  s['LD_RUNPATH_SEARCH_PATHS']        = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
  s['MARKETING_VERSION']              = host['MARKETING_VERSION']        # 호스트와 같은 버전 (xcargs 로 둘 다 덮어쓴다)
  s['CURRENT_PROJECT_VERSION']        = host['CURRENT_PROJECT_VERSION']
  s['CODE_SIGN_STYLE']                = 'Manual'
  s['DEVELOPMENT_TEAM']               = '6YM72N6FPD'
end

# 호스트 앱에 embed = 의존성 + Copy Files(PlugIns=13) 단계
app.add_dependency(ext)
embed = app.new_copy_files_build_phase('Embed Foundation Extensions')
embed.symbol_dst_subfolder_spec = :plug_ins
bf = embed.add_file_reference(ext.product_reference)
bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

project.save
puts "OK: targets=#{project.targets.map(&:name).join(',')}"

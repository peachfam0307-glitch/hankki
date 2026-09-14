# ios-app/scripts/add-share-extension-resource.rb — ShareExtension 타깃에 리소스 파일 하나를 넣는다 (Xcode 없이 · xcodeproj gem)
#   실행: cd ios-app && ruby scripts/add-share-extension-resource.rb ios/App/App.xcodeproj gom.png
require 'xcodeproj'
proj_path = ARGV[0] || 'ios/App/App.xcodeproj'
name = ARGV[1] or abort 'usage: <xcodeproj> <파일이름>'
project = Xcodeproj::Project.open(proj_path)
ext = project.targets.find { |t| t.name == 'ShareExtension' } or abort 'ShareExtension target not found'
grp = project.main_group['ShareExtension'] or abort 'ShareExtension group not found'
abort "#{name} already in group" if grp.files.any? { |f| f.path == name }
ref = grp.new_file(name)
ext.resources_build_phase.add_file_reference(ref)
project.save
puts "OK: #{name} → ShareExtension Resources (#{ext.resources_build_phase.files.map { |f| f.file_ref.path }.join(',')})"

module Pageflow
  module BuiltInFileType
    def self.image
      FileType.new(model: 'Pageflow::ImageFile',
                   editor_partial: 'pageflow/editor/image_files/image_file',
                   collection_name: 'image_files')
    end

    def self.video
      FileType.new(model: 'Pageflow::VideoFile',
                   editor_partial: 'pageflow/editor/video_files/video_file',
                   collection_name: 'video_files',
                   nested_file_types: [BuiltInFileType.text_track])
    end

    def self.audio
      FileType.new(model: 'Pageflow::AudioFile',
                   editor_partial: 'pageflow/editor/audio_files/audio_file',
                   collection_name: 'audio_files',
                   nested_file_types: [BuiltInFileType.text_track])
    end

    def self.text_track
      FileType.new(model: 'Pageflow::TextTrackFile',
                   editor_partial: 'pageflow/editor/text_track_files/text_track_file',
                   collection_name: 'text_track_files')
    end
  end
end

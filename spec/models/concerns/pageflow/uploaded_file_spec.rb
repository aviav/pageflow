require 'spec_helper'

module Pageflow
  describe UploadedFile do
    describe 'parent_allows_type_for_nesting validation' do
      it 'returns invalid if nested type is unregistered with parent' do
        parent_file = create(:image_file)

        nested_file = ImageFile.new(parent_file: parent_file)

        expect(nested_file).to_not be_valid
      end

      it 'returns valid if nested type is registered with parent' do
        parent_file = create(:video_file)

        nested_file = TextTrackFile.new(parent_file: parent_file)

        expect(nested_file).to be_valid
      end
    end

    describe '#nested_files' do
      it 'returns nested files of provided class' do
        parent_file = create(:video_file)
        nested_file = create(:text_track_file, parent_file: parent_file)

        nested_text_track_files = parent_file.nested_files(TextTrackFile)

        expect(nested_text_track_files.first).to eq(nested_file)
      end
    end
  end
end

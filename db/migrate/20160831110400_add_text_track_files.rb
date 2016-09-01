class AddTextTrackFiles < ActiveRecord::Migration
  def change
    create_table :pageflow_text_track_files do |t|
      t.belongs_to(:entry, index: true)
      t.belongs_to(:uploader, index: true)

      t.string(:state)
      t.string(:rights)

      t.string(:attachment_on_filesystem_file_name)
      t.string(:attachment_on_filesystem_content_type)
      t.integer(:attachment_on_filesystem_file_size, limit: 8)
      t.datetime(:attachment_on_filesystem_updated_at)

      t.string(:attachment_on_s3_file_name)
      t.string(:attachment_on_s3_content_type)
      t.integer(:attachment_on_s3_file_size, limit: 8)
      t.datetime(:attachment_on_s3_updated_at)

      t.timestamps

      t.integer(:parent_file_id)
      t.string(:parent_file_model_type)

      t.string(:label)
      t.string(:kind)
      t.string(:srclang)
    end
  end
end

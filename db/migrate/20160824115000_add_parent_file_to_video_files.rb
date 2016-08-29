class AddParentFileToVideoFiles < ActiveRecord::Migration
  def change
    add_column :pageflow_video_files, :parent_file_id, :integer
    add_column :pageflow_video_files, :parent_file_model_type, :string
  end
end

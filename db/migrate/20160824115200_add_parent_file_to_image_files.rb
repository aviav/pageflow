class AddParentFileToImageFiles < ActiveRecord::Migration
  def change
    add_column :pageflow_image_files, :parent_file_id, :integer
    add_column :pageflow_image_files, :parent_file_model_type, :string
  end
end

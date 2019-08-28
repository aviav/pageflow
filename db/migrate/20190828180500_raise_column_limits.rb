class RaiseColumnLimits < ActiveRecord::Migration[5.2]
  def up
    change_column(:pageflow_accounts, :features_configuration, :mediumtext)
    change_column(:pageflow_chapters, :configuration, :mediumtext)
    change_column(:pageflow_entries, :features_configuration, :mediumtext)
    change_column(:pageflow_file_usages, :configuration, :mediumtext)
    change_column(:pageflow_pages, :configuration, :mediumtext)
    change_column(:pageflow_revisions, :credits, :mediumtext)
    change_column(:pageflow_revisions, :summary, :mediumtext)
    change_column(:pageflow_revisions, :share_providers, :mediumtext)
    change_column(:pageflow_storylines, :configuration, :mediumtext)
    change_column(:pageflow_widgets, :configuration, :mediumtext)
  end

  def down
    change_column(:pageflow_accounts, :features_configuration, :text)
    change_column(:pageflow_chapters, :configuration, :text)
    change_column(:pageflow_entries, :features_configuration, :text)
    change_column(:pageflow_file_usages, :configuration, :text)
    change_column(:pageflow_pages, :configuration, :text)
    change_column(:pageflow_revisions, :credits, :text)
    change_column(:pageflow_revisions, :summary, :text)
    change_column(:pageflow_revisions, :share_providers, :text)
    change_column(:pageflow_storylines, :configuration, :text)
    change_column(:pageflow_widgets, :configuration, :text)
  end
end

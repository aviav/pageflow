require 'spec_helper'

module Pageflow
  describe Admin::EntryTemplatesTab, type: :view_component do
    before do
      helper.extend(ActiveAdmin::ViewHelpers)
    end

    it "has entries even if corresponding entry templates aren't created yet" do
      ponies = TestEntryType.new(name: 'ponies')
      rainbows = TestEntryType.new(name: 'rainbows')
      glitter = TestEntryType.new(name: 'glitter')
      pageflow_configure do |config|
        config.entry_types.register(ponies)
        config.entry_types.register(rainbows)
        config.entry_types.register(glitter)
      end

      account = create(:account)

      render(account.themings.first)

      expect(rendered).to have_text('ponies')
      expect(rendered).to have_text('rainbows')
      expect(rendered).to have_text('glitter')
    end

    it 'only has entries if entry type feature is enabled for account' do
      ponies = TestEntryType.new(name: 'ponies')
      rainbows = TestEntryType.new(name: 'rainbows')
      pageflow_configure do |config|
        config.features.register('ponies_entry_type') do |feature_config|
          feature_config.entry_types.register(ponies)
        end
        config.features.register('rainbows_entry_type') do |feature_config|
          feature_config.entry_types.register(rainbows)
        end
        config.features.enable_by_default('ponies_entry_type')
        config.features.enable_by_default('rainbows_entry_type')
      end

      account = create(:account, features_configuration: {
                         'rainbows_entry_type' => false
                       })

      render(account.themings.first)

      expect(rendered).to have_text('ponies')
      expect(rendered).not_to have_text('rainbows')
    end
  end
end

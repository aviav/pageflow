module Pageflow
  module TestEntryType
    def self.register(config, options = {})
      entry_type_conf = options.delete(:entry_type_conf) ||
                        TestEntryTypeConfiguration.new(config)
      config.entry_types.register(new(options), entry_type_conf)
    end

    def self.new(options = {})
      EntryType.new(name: 'test',
                    editor_fragment_renderer: nil,
                    frontend_app: -> {},
                    **options)
    end

    class TestEntryTypeConfiguration
      include Pageflow::Configuration::EntryTypeConfiguration

      def initialize(config)
        assign_config(config)
      end
    end
  end
end

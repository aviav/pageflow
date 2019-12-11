module PageflowScrolled
  # @api private
  class Plugin < Pageflow::Plugin
    def configure(config)
      config.entry_types.register(PageflowScrolled.entry_type,
                                  ScrolledConfiguration.new(config))
    end

    class ScrolledConfiguration
      include Pageflow::Configuration::EntryTypeConfiguration

      def initialize(config)
        assign_config(config)
      end
    end
  end
end

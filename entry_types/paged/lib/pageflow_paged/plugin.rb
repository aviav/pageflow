module PageflowPaged
  # @api private
  class Plugin < Pageflow::Plugin
    def configure(config)
      config.entry_types.register(PageflowPaged.entry_type,
                                  PagedConfiguration.new(config))
    end

    class PagedConfiguration
      include Pageflow::Configuration::EntryTypeConfiguration

      attr_accessor :page_types

      def initialize(config)
        @page_types = Pageflow::PageTypes.new
        assign_config(config)
      end
    end
  end
end

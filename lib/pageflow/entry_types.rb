module Pageflow
  # A collection of {EntryType} objects.
  #
  # @since 15.1
  class EntryTypes
    # @api private
    def initialize
      @entry_types_by_name = {}
      @entry_type_configurations_by_type_name = {}
    end

    # Register an entry type.
    #
    # @param entry_type [EntryType]
    def register(entry_type, configuration)
      @entry_types_by_name[entry_type.name] = entry_type
      @entry_type_configurations_by_type_name[entry_type.name] = configuration
    end

    # @api private
    def find_by_name!(name)
      @entry_types_by_name.fetch(name) do
        raise "Unknown entry type with name #{name}."
      end
    end

    # @api private
    def find_config_by_name!(name)
      @entry_type_configurations_by_type_name.fetch(name) do
        raise "Unknown entry type with name #{name}."
      end
    end
  end
end

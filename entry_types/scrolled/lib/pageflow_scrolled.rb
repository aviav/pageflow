require 'pageflow_scrolled/engine'

# Entry type plugin for entries using native scrolling
module PageflowScrolled
  class << self
    def plugin
      PageflowScrolled::Plugin.new
    end

    def entry_type
      Pageflow::EntryType.new(name: 'scrolled',
                              frontend_app: PageflowScrolled::EntriesController.action(:show),
                              editor_fragment_renderer: editor_fragment_renderer,
                              configuration: Plugin::ScrolledConfiguration)
    end

    private

    def editor_fragment_renderer
      Pageflow::PartialEditorFragmentRenderer.new(PageflowScrolled::Editor::EntriesController)
    end
  end
end

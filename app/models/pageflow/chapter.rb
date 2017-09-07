module Pageflow
  class Chapter < ActiveRecord::Base
    include SerializedConfiguration

    belongs_to :storyline, touch: true
    has_many :pages, -> { order('position ASC') }, dependent: :destroy

    delegate :entry, to: :storyline

    def copy_to(storyline)
      chapter = dup
      storyline.chapters << chapter

      pages.each do |page|
        page.copy_to(chapter)
      end
    end
  end
end

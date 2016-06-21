module Pageflow
  FactoryGirl.define do
    sequence :title do |n|
      "Entry #{n}"
    end

    factory :entry, class: Entry do
      title

      account

      after(:build) do |entry|
        entry.theming ||= entry.account.default_theming
      end

      # inline membership creation

      transient do
        invite_previewer nil
        invite_editor nil
        invite_publisher nil
        invite_manager nil
        with_previewer nil
        with_editor nil
        with_publisher nil
        with_manager nil
      end

      after(:create) do |entry, evaluator|
        create(:invitation,
               entity: entry,
               user: evaluator.invite_previewer,
               role: :previewer) if evaluator.invite_previewer
        create(:invitation,
               entity: entry,
               user: evaluator.invite_editor,
               role: :editor) if evaluator.invite_editor
        create(:invitation,
               entity: entry,
               user: evaluator.invite_publisher,
               role: :publisher) if evaluator.invite_publisher
        create(:invitation,
               entity: entry,
               user: evaluator.invite_manager,
               role: :manager) if evaluator.invite_manager
        create(:membership,
               entity: entry,
               user: evaluator.with_previewer,
               role: :previewer) if evaluator.with_previewer
        create(:membership,
               entity: entry,
               user: evaluator.with_editor,
               role: :editor) if evaluator.with_editor
        create(:membership,
               entity: entry,
               user: evaluator.with_publisher,
               role: :publisher) if evaluator.with_publisher
        create(:membership,
               entity: entry,
               user: evaluator.with_manager,
               role: :manager) if evaluator.with_manager
      end

      trait :published do
        transient do
          published_revision_attributes({})
        end

        after(:create) do |entry, evaluator|
          create(:revision, :published, evaluator.published_revision_attributes.merge(entry: entry))
        end
      end

      trait :published_with_password do
        after(:create) do |entry, _evaluator|
          create(:revision, :published, entry: entry, password_protected: true)
        end
      end
    end
  end
end

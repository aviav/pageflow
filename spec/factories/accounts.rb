FactoryGirl.define do
  factory :account, class: Pageflow::Account do
    name 'Account Name'

    after(:build) do |account|
      account.default_theming ||= build(:theming, account: account)
    end

    # inline membership creation

    transient do
      invite_member nil
      invite_previewer nil
      invite_editor nil
      invite_publisher nil
      invite_manager nil
      with_member nil
      with_previewer nil
      with_editor nil
      with_publisher nil
      with_manager nil
    end

    after(:create) do |account, evaluator|
      create(:invitation,
             entity: account,
             user: evaluator.invite_member,
             first_name: evaluator.invite_member.first_name,
             last_name: evaluator.invite_member.last_name,
             role: :member) if evaluator.invite_member
      create(:invitation,
             entity: account,
             user: evaluator.invite_previewer,
             first_name: evaluator.invite_previewer.first_name,
             last_name: evaluator.invite_previewer.last_name,
             role: :previewer) if evaluator.invite_previewer
      create(:invitation,
             entity: account,
             user: evaluator.invite_editor,
             first_name: evaluator.invite_editor.first_name,
             last_name: evaluator.invite_editor.last_name,
             role: :editor) if evaluator.invite_editor
      create(:invitation,
             entity: account,
             user: evaluator.invite_publisher,
             first_name: evaluator.invite_publisher.first_name,
             last_name: evaluator.invite_publisher.last_name,
             role: :publisher) if evaluator.invite_publisher
      create(:invitation,
             entity: account,
             user: evaluator.invite_manager,
             first_name: evaluator.invite_manager.first_name,
             last_name: evaluator.invite_manager.last_name,
             role: :manager) if evaluator.invite_manager
      create(:membership,
             entity: account,
             user: evaluator.with_member,
             role: :member) if evaluator.with_member
      create(:membership,
             entity: account,
             user: evaluator.with_previewer,
             role: :previewer) if evaluator.with_previewer
      create(:membership,
             entity: account,
             user: evaluator.with_editor,
             role: :editor) if evaluator.with_editor
      create(:membership,
             entity: account,
             user: evaluator.with_publisher,
             role: :publisher) if evaluator.with_publisher
      create(:membership,
             entity: account,
             user: evaluator.with_manager,
             role: :manager) if evaluator.with_manager
    end
  end
end

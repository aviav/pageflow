module Pageflow
  module Admin
    class UsersTab < ViewComponent
      def build(theming)
        account = theming.account
        embedded_index_table(account.memberships.on_accounts.includes(:user)
                              .accessible_by(current_ability, :index)
                                            .where('pageflow_memberships.user_id IS NOT NULL'),
                             blank_slate_text: I18n.t('pageflow.admin.accounts.no_members')) do
          table_for_collection class: 'memberships', sortable: true, i18n: Pageflow::Membership do
            column :full_name, sortable: 'users.last_name' do |membership|
              link_to membership.user.formal_name, admin_user_path(membership.user)
            end
            column :role, sortable: 'pageflow_memberships.role' do |membership|
              membership_role_with_tooltip(membership.role, scope: 'accounts')
            end
            column :created_at
            column do |membership|
              if authorized?(:update, membership)
                link_to(I18n.t('pageflow.admin.users.edit_role'),
                        edit_admin_account_membership_path(membership.entity,
                                                           membership,
                                                           entity_type: :account),
                        data: {
                          rel: "edit_account_role_#{membership.role}"
                        })
              end
            end
            column do |membership|
              if authorized?(:destroy, membership)
                link_to(I18n.t('pageflow.admin.users.delete'),
                        admin_account_membership_path(membership.entity, membership),
                        method: :delete,
                        data: {
                          confirm: I18n.t('active_admin.delete_confirmation'),
                          rel: "delete_account_membership_#{membership.role}"
                        })
              end
            end
          end
        end
        if Pageflow.config.invitation_workflows
          embedded_index_table(account.invitations.on_accounts.includes(:user)
                                .accessible_by(Ability.new(current_user), :index)
                                .where('pageflow_invitations.user_id IS NOT NULL'),
                               blank_slate_text: I18n
                                 .t('pageflow.admin.accounts.no_invited_users')) do
            table_for_collection class: 'invitations', sortable: true, i18n: Pageflow::Invitation do
              column :full_name, sortable: 'last_name' do |invitation|
                link_to invitation.formal_name, admin_user_path(invitation.user)
              end
              column :role, sortable: 'pageflow_invitations.role' do |invitation|
                span I18n.t(invitation.role, scope: 'activerecord.values.pageflow/membership.role'),
                     class: "invitation_role #{invitation.role} tooltip_clue" do
                  div I18n.t(invitation.role,
                             scope: 'pageflow.admin.users.roles.accounts.tooltip'),
                      class: 'tooltip_bubble'
                end
              end
              column :created_at
              column do |invitation|
                if authorized?(:update, invitation)
                  link_to(I18n.t('pageflow.admin.users.edit_role'),
                          edit_admin_account_invitation_path(invitation.entity,
                                                             invitation,
                                                             entity_type: :account),
                          data: {
                            rel: "edit_account_invitation_role_#{invitation.role}"
                          })
                end
              end
              column do |invitation|
                if authorized?(:destroy, invitation)
                  link_to(I18n.t('pageflow.admin.users.delete'),
                          admin_account_invitation_path(invitation.entity, invitation),
                          method: :delete,
                          data: {
                            confirm: I18n.t('active_admin.delete_confirmation'),
                            rel: "delete_account_invitation_#{invitation.role}"
                          })
                end
              end
            end
          end
        end
        add_membership_button_if_needed(current_user, account, 'account')
      end
    end
  end
end

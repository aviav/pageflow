module Pageflow
  ActiveAdmin.register Membership, as: 'Membership' do
    menu false

    actions :new, :create, :edit, :update, :destroy

    form partial: 'form'

    controller do
      belongs_to :entry, parent_class: Pageflow::Entry, polymorphic: true
      belongs_to :account, parent_class: Pageflow::Account, polymorphic: true
      belongs_to :user, parent_class: User, polymorphic: true

      helper Pageflow::Admin::MembershipsHelper
      helper Pageflow::Admin::FormHelper

      def index
        if params[:user_id].present?
          redirect_to admin_user_url(params[:user_id])
        elsif params[:entry_id].present?
          redirect_to admin_entry_url(params[:entry_id])
        else
          redirect_to admin_account_url(params[:account_id])
        end
      end

      def create_resource(membership)
        if membership.entity_type == 'Pageflow::Entry' &&
           membership.user.invited_accounts.include?(Entry.find(membership.entity_id).account)
          Invitation.create(user: membership.user,
                            entity_id: membership.entity_id,
                            entity_type: 'Pageflow::Entry',
                            first_name: membership.user.first_name,
                            last_name: membership.user.last_name,
                            role: membership.role).errors.inspect.to_s
        else
          super
        end
      end

      def destroy
        if resource.entity_type == 'Pageflow::Account'
          resource.entity.entry_memberships.where(user: resource.user).destroy_all
        end

        destroy! do
          if authorized?(:redirect_to_user, resource.user) && params[:user_id]
            admin_user_url(resource.user)
          elsif authorized?(:redirect_to_user, resource.user) && params[:entry_id]
            admin_entry_url(resource.entity)
          elsif params[:user_id] && authorized?(:index, resource.user)
            admin_users_url
          elsif params[:account_id]
            admin_accounts_url
          else
            admin_entries_url
          end
        end
      end

      def permitted_params
        params.permit(membership: [:user_id, :entity_id, :entity_type, :role])
      end
    end
  end
end

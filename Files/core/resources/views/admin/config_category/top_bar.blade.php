<div class="admin-status-tabs mb-4" role="tablist">
    <a href="{{ route('admin.category.index') }}"
       role="tab"
       aria-selected="{{ menuActive(['admin.category.index']) ? 'true' : 'false' }}"
       class="admin-status-tabs__tab {{ menuActive(['admin.category.index']) ? 'is-active' : '' }}">
        @lang('Categories')
    </a>
    <a href="{{ route('admin.category.subcategories') }}"
       role="tab"
       aria-selected="{{ menuActive(['admin.category.subcategories']) ? 'true' : 'false' }}"
       class="admin-status-tabs__tab {{ menuActive(['admin.category.subcategories']) ? 'is-active' : '' }}">
        @lang('Subcategories')
    </a>
    <a href="{{ route('admin.category.skills') }}"
       role="tab"
       aria-selected="{{ menuActive(['admin.category.skills']) ? 'true' : 'false' }}"
       class="admin-status-tabs__tab {{ menuActive(['admin.category.skills']) ? 'is-active' : '' }}">
        @lang('Skills')
    </a>
    <a href="{{ route('admin.marketplace.forms.index') }}"
       role="tab"
       aria-selected="{{ menuActive(['admin.marketplace.forms*']) ? 'true' : 'false' }}"
       class="admin-status-tabs__tab {{ menuActive(['admin.marketplace.forms*']) ? 'is-active' : '' }}">
        @lang('Form Builder')
    </a>
</div>

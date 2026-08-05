<div class="admin-status-tabs mb-4" role="tablist">
    <a href="{{ route('admin.gateway.automatic.index') }}"
       role="tab"
       aria-selected="{{ menuActive(['admin.gateway.automatic.index','admin.gateway.automatic.edit']) ? 'true' : 'false' }}"
       class="admin-status-tabs__tab {{ menuActive(['admin.gateway.automatic.index','admin.gateway.automatic.edit']) ? 'is-active' : '' }}">
        @lang('Automatic Gateway')
    </a>
    <a href="{{ route('admin.gateway.manual.index') }}"
       role="tab"
       aria-selected="{{ menuActive(['admin.gateway.manual.index','admin.gateway.manual.edit','admin.gateway.manual.create']) ? 'true' : 'false' }}"
       class="admin-status-tabs__tab {{ menuActive(['admin.gateway.manual.index','admin.gateway.manual.edit','admin.gateway.manual.create']) ? 'is-active' : '' }}">
        @lang('Manual Gateway')
    </a>
</div>

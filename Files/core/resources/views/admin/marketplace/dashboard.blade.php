@extends('admin.layouts.app')
@section('panel')
    <div class="row gy-4 mb-4">
        <div class="col-xxl-3 col-sm-6">
            <x-widget style="6" link="{{ route('admin.jobs.published') }}" title="Published Requests" icon="las la-briefcase"
                value="{{ $metrics['published_requests'] }}" bg="primary" />
        </div>
        <div class="col-xxl-3 col-sm-6">
            <x-widget style="6" link="{{ route('admin.jobs.pending') }}" title="Pending Approval" icon="las la-hourglass-half"
                value="{{ $metrics['pending_approval'] }}" bg="warning" />
        </div>
        <div class="col-xxl-3 col-sm-6">
            <x-widget style="6" link="{{ route('admin.bids.index') }}" title="Total Quotes" icon="las la-gavel"
                value="{{ $metrics['total_quotes'] }}" bg="info" />
        </div>
        <div class="col-xxl-3 col-sm-6">
            <x-widget style="6" link="{{ route('admin.bids.index', ['status' => Status::BID_ACCEPTED]) }}" title="Hired Quotes"
                icon="las la-handshake" value="{{ $metrics['hired_quotes'] }}" bg="success" />
        </div>
        <div class="col-xxl-3 col-sm-6">
            <x-widget style="6" link="{{ route('admin.disputes.index') }}" title="Open Disputes" icon="las la-exclamation-triangle"
                value="{{ $metrics['open_disputes'] }}" bg="danger" />
        </div>
        <div class="col-xxl-3 col-sm-6">
            <x-widget style="6" link="{{ route('admin.users.pending.approval') }}" title="Pending Providers"
                icon="las la-user-check" value="{{ $metrics['pending_providers'] }}" bg="dark" />
        </div>
        <div class="col-xxl-3 col-sm-6">
            <x-widget style="6" link="{{ route('admin.reviews.pending') }}" title="Pending Reviews" icon="las la-star"
                value="{{ $metrics['pending_reviews'] }}" bg="17" />
        </div>
        <div class="col-xxl-3 col-sm-6">
            <x-widget style="6" link="{{ route('admin.project.reported') }}" title="Reported Projects"
                icon="las la-flag" value="{{ $metrics['reported_projects'] }}" bg="6" />
        </div>
    </div>

    <div class="row gy-4 mb-4">
        <div class="col-lg-8">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">@lang('Requests & Quotes — Last 30 Days')</h5>
                </div>
                <div class="card-body">
                    <div id="marketplaceActivityChart"></div>
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            <div class="card h-100">
                <div class="card-header">
                    <h5 class="card-title mb-0">@lang('Conversion Snapshot')</h5>
                </div>
                <div class="card-body">
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item d-flex justify-content-between">
                            <span>@lang('Hire rate')</span>
                            <strong>{{ $metrics['hire_rate'] }}%</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>@lang('Quotes per request')</span>
                            <strong>{{ $metrics['quotes_per_request'] }}</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>@lang('Pending quotes')</span>
                            <strong>{{ $metrics['pending_quotes'] }}</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>@lang('Running projects')</span>
                            <strong>{{ $metrics['running_projects'] }}</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>@lang('Completed requests')</span>
                            <strong>{{ $metrics['completed_requests'] }}</strong>
                        </li>
                        @if ($metrics['monetisation_enabled'])
                            <li class="list-group-item d-flex justify-content-between">
                                <span>@lang('Credits purchased (30d)')</span>
                                <strong>{{ $metrics['credit_purchases_30d'] ?? 0 }}</strong>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>@lang('Credits used (30d)')</span>
                                <strong>{{ $metrics['credits_used_30d'] ?? 0 }}</strong>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>@lang('Active subscriptions')</span>
                                <strong>{{ $metrics['active_subscriptions'] ?? 0 }}</strong>
                            </li>
                        @endif
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <div class="row gy-4">
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">@lang('Recent Disputes')</h5>
                    <a href="{{ route('admin.disputes.index') }}" class="btn btn-sm btn-outline--primary">@lang('View All')</a>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table--light style--two mb-0">
                            <thead>
                                <tr>
                                    <th>@lang('Subject')</th>
                                    <th>@lang('Raised By')</th>
                                    <th>@lang('Status')</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($recentDisputes as $dispute)
                                    <tr>
                                        <td>
                                            <a href="{{ route('admin.disputes.detail', $dispute->id) }}">
                                                {{ strLimit($dispute->subject, 40) }}
                                            </a>
                                        </td>
                                        <td>{{ ucfirst($dispute->raised_by) }}</td>
                                        <td>@php echo $dispute->statusBadge @endphp</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="3" class="text-center text-muted">@lang('No disputes yet.')</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">@lang('Recent Quotes')</h5>
                    <a href="{{ route('admin.bids.index') }}" class="btn btn-sm btn-outline--primary">@lang('View All')</a>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table--light style--two mb-0">
                            <thead>
                                <tr>
                                    <th>@lang('Provider')</th>
                                    <th>@lang('Request')</th>
                                    <th>@lang('Amount')</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($recentQuotes as $quote)
                                    <tr>
                                        <td>{{ $quote->user?->username ?? '—' }}</td>
                                        <td>{{ strLimit($quote->job?->title ?? '—', 35) }}</td>
                                        <td>
                                            <a href="{{ route('admin.bids.detail', $quote->id) }}">
                                                {{ showAmount($quote->bid_amount) }}
                                            </a>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="3" class="text-center text-muted">@lang('No quotes yet.')</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('script-lib')
    <script src="{{ asset('assets/admin/js/vendor/apexcharts.min.js') }}"></script>
@endpush

@push('script')
    <script>
        (function() {
            const chartData = @json($chart);
            const options = {
                series: [{
                        name: @json(__('Requests')),
                        data: chartData.requests
                    },
                    {
                        name: @json(__('Quotes')),
                        data: chartData.quotes
                    }
                ],
                chart: {
                    type: 'area',
                    height: 320,
                    toolbar: {
                        show: false
                    }
                },
                colors: ['#0071e3', '#6e6e73'],
                dataLabels: {
                    enabled: false
                },
                stroke: {
                    curve: 'smooth',
                    width: 2
                },
                xaxis: {
                    categories: chartData.labels
                },
                legend: {
                    position: 'top'
                }
            };
            new ApexCharts(document.querySelector('#marketplaceActivityChart'), options).render();
        })();
    </script>
@endpush

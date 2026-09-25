<table class="table table--responsive--md">
    <thead>
        <tr>
            <th> @lang('Job') </th>
            <th>@lang('Category | Speciality')</th>
            <th> @lang('Budget') </th>
            <th> @lang('Approved') </th>
            <th> @lang('Total Bid') </th>
            <th> @lang('Status') </th>
            @if (!request()->routeIs('buyer.home'))
                <th> @lang('Action') </th>
            @endif
        </tr>
    </thead>
    <tbody>
        @forelse ($jobs as $job)
            <tr>
                <td><span class="clamping"> {{ __($job->title) }} </span></td>
                <td>
                    <div>
                        {{ __($job->category->name) }}
                        <br>
                        <span class="text--info">{{ __($job->subcategory->name) }}</span>
                    </div>
                </td>
                <td> {{ showAmount($job->budget) }} </td>

                <td>
                    @if ($job->is_approved == Status::NO)
                        <span class="badge badge--warning">@lang('Pending')</span>
                    @elseif ($job->is_approved == Status::JOB_APPROVED)
                        <span class="badge badge--success">@lang('Yes')</span>
                    @else
                        <span class="badge badge--danger">@lang('Rejected')</span>
                    @endif
                </td>
                <td> {{ $job->bids_count }}</td>
                <td> @php echo $job->statusBadge @endphp</td>
                @if (!request()->routeIs('buyer.home'))
                    <td>
                        <div class="action-btn">

                            <button class="action-btn__icon">
                                <i class="fa-solid fa-caret-down"></i>
                            </button>
                            <ul class="action-dropdown">
                                <li class="action-dropdown__item">
                                    @php
                                        $scope =
                                            $job->project_scope == Status::SCOPE_LARGE
                                                ? __('Large Project')
                                                : ($job->project_scope == Status::SCOPE_MEDIUM
                                                    ? __('Medium Project')
                                                    : __('Small Project'));
                                    @endphp
                                    <button class="action-dropdown__link detailBtn" data-job_title="{{ $job->title }}"
                                        data-scope="{{ $scope }}"
                                        data-deadline="{{ showDateTime($job->deadline, 'd M, Y') }}">
                                        <span class="text"><i class="las la-desktop"></i> @lang('Details')</span>
                                    </button>
                                </li>
                                @if ($job->is_approved == Status::NO)
                                    <li class="action-dropdown__item"><a class="action-dropdown__link"
                                            href="{{ route('buyer.job.post.details', $job->id) }}">
                                            <span class="text"><i class="las la-pen"></i>
                                                @lang('Edit')</span>
                                        </a></li>
                                @endif
                                @if ($job->slug)
                                    <li class="action-dropdown__item"><a class="action-dropdown__link"
                                            href="{{ route('explore.bid.job', $job->slug) }}" target="_blank"
                                            rel="noopener noreferrer">
                                            <span class="text"><i class="las la-expand-arrows-alt"></i>
                                                @lang('Explore') </span>
                                        </a></li>
                                @endif

                                @if ($job->is_approved)
                                    <li class="action-dropdown__item"><a class="action-dropdown__link"
                                            href="{{ route('buyer.job.post.bids', $job->id) }}">
                                            <span class="text"><i class="las la-columns"></i>
                                                @lang('Compare Quotes') </span>
                                        </a>
                                    </li>
                                @endif
                            </ul>
                        </div>
                    </td>
                @endif
            </tr>
        @empty
            <tr>
                <td colspan="100%" class="text-center msg-center">
                    <div class="empty-message text-center py-5">
                        <img src="{{ asset(activeTemplate(true) . 'images/empty.png') }}" alt="empty">
                        <h6 class="text-muted mt-3">@lang('Job not found!')</h6>
                    </div>
                </td>
            </tr>
        @endforelse
    </tbody>
</table>

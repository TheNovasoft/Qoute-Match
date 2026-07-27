@extends('admin.layouts.app')

@section('panel')
    <div class="row">
        <div class="col-12">
            <div class="row gy-4">
                <div class="col-xxl-3 col-sm-6">
                    <x-widget style="7" link="#" title="Bids" icon="las la-gavel" value="{{ $widget['total_bid'] }}" bg="indigo" type="2" />
                </div>
                <div class="col-xxl-3 col-sm-6">
                    <x-widget style="7" link="#" title="Interviews" icon="la la-handshake" value="{{ $widget['total_interview'] }}" bg="6" type="2" />
                </div>
                <div class="col-xxl-3 col-sm-6">
                    <x-widget style="7" link="#" title="Apply Deadline" icon="las la-calendar-alt" value="{{ showDateTime($job->deadline, 'd M, Y') }}" bg="17" type="2" />
                </div>
                <div class="col-xxl-3 col-sm-6">
                    <x-widget style="7" link="{{ $widget['assign_freelancer'] ? route('admin.users.detail', $widget['assign_freelancer']->id) : '#' }}" title="Project Assign" icon="las la-user" value="{{ $widget['assign_freelancer']->fullname ?? __('N/A') }}" bg="17" type="2" />
                </div>
            </div>

            <div class="card mt-30">
                <div class="card-header">
                    <div class="job-item__top">
                        <h5 class="job-title">{{ __($job->title) }}</h5>
                        <div class="job-meta">
                            <span class="badge badge--primary">@lang('100% Remote Work')</span>
                            <small class="job-time">
                                {{ getJobTimeDifference($job->created_at, $job->deadline) }}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Job Details -->
                    <div class="job-item">
                        <p class="job-desc">@php echo  $job->description; @endphp</p>
                    </div>

                    @include('Template::buyer.job.partials.request_data_summary', ['requestFields' => $requestFields ?? []])

                    <!-- Project Info -->
                    <div class="project-info-wrapper mt-30">
                        <h6 class="section-title">@lang('Project Information')</h6>



                        <div class="project-info-grid">
                            <div class="row">
                                <div class="col-xl-3 col-lg-4 col-md-4 col-sm-6  mb-30">
                                    <div class="project-info__item">
                                        <i class="las la-layer-group project-icon"></i>
                                        <div>
                                            <p class="info-label">@lang('Category')</p>
                                            <span>{{ __($job->category->name) }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-3 col-lg-4 col-md-4 col-sm-6  mb-30">
                                    <div class="project-info__item">
                                        <i class="las la-object-ungroup project-icon"></i>
                                        <div>
                                            <p class="info-label">@lang('Specialty')</p>
                                            <span>{{ __($job->subcategory->name) }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-3 col-lg-4 col-md-4 col-sm-6  mb-30">
                                    <div class="project-info__item">
                                        <i class="las la-calendar project-icon"></i>
                                        <div>
                                            <p class="info-label">@lang('Deadline')</p>
                                            <span>{{ showDateTime($job->deadline, 'd M, Y') }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-3 col-lg-4 col-md-4 col-sm-6  mb-30">
                                    <div class="project-info__item">
                                        <i class="las la-map-marker project-icon"></i>
                                        <div>
                                            <p class="info-label">@lang('Location')</p>
                                            <span>@lang('Remote Job')</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-3 col-lg-4 col-md-4 col-sm-6  mb-30">
                                    <div class="project-info__item">
                                        <i class="las la-brain project-icon"></i>
                                        <div>
                                            <p class="info-label">@lang('Experience level')</p>
                                            <span>
                                                @if ($job->skill_level == Status::SKILL_PRO)
                                                    @lang('Pro Level')
                                                @elseif($job->skill_level == Status::SKILL_EXPERT)
                                                    @lang('Expert')
                                                @elseif($job->skill_level == Status::SKILL_INTERMEDIATE)
                                                    @lang('Intermediate')
                                                @else
                                                    @lang('Entry')
                                                @endif
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-3 col-lg-4 col-md-4 col-sm-6  mb-30">
                                    <div class="project-info__item">
                                        <i class="las la-briefcase project-icon"></i>
                                        <div>
                                            <p class="info-label">@lang('Project Scope')</p>
                                            <span class="title">
                                                @if ($job->project_scope == Status::SCOPE_LARGE)
                                                    @lang('Large')
                                                @elseif($job->project_scope == Status::SCOPE_MEDIUM)
                                                    @lang('Medium')
                                                @else
                                                    @lang('Small')
                                                @endif
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-3 col-lg-4 col-md-4 col-sm-6  mb-30">
                                    <div class="project-info__item">
                                        <i class="las la-calendar project-icon"></i>
                                        <div>
                                            <p class="info-label">@lang('Job Longevity')</p>
                                            <span class="title">
                                                @if ($job->job_longevity == Status::JOB_LONGEVITY_WEEK)
                                                    @lang('Less than 1 Week')
                                                @elseif($job->job_longevity == Status::JOB_LONGEVITY_MONTH)
                                                    @lang('Less than 1 month')
                                                @elseif($job->job_longevity == Status::JOB_LONGEVITY_ABOVE_MONTH)
                                                    @lang('1 to 3 months')
                                                @else
                                                    @lang('3 to 6 months')
                                                @endif
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-3 col-lg-4 col-md-4 col-sm-6  mb-30">
                                    <div class="project-info__item">
                                        <i class="las la-map-marker project-icon"></i>
                                        <div>
                                            <p class="info-label">@lang('Job From')</p>
                                            <span>{{ __($job->buyer->country_name) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>





                    </div>

                    <!-- Budget -->
                    <div class="budget-section mt-4">
                        <h6 class="section-title">@lang('Price | Budget')</h6>
                        <p class="budget-amount">{{ showAmount($job->budget) }}</p>
                    </div>

                    <!-- Skills and Expertise -->
                    <div class="skills-section mt-5  @if (!$job->questions) mb-30 @endif">
                        <h6 class="section-title">@lang('Skill and Expertise for this Job')</h6>
                        <ul class="skill-list">
                            @foreach ($job->skills as $skill)
                                <li class="skill-item">
                                    <span class="badge badge--info">{{ __($skill->name) }}</span>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                    @if ($job->questions)
                        <div class="question-section mb-30 mt-4">
                            <div class="question-header">
                                <h4>@lang('Job Relevant Buyer Questions for Freelancers')</h4>
                            </div>
                            <ul class="question-list">
                                @foreach ($job->questions as $question)
                                    <li class="question-item">
                                        <i class="las la-question-circle question-icon"></i>
                                        <span>{{ $question }}</span>
                                    </li>
                                @endforeach
                            </ul>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>


    <div id="rejectModal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        @lang('Reject Job Post')
                    </h5>
                    <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="las la-times"></i>
                    </button>
                </div>
                <form action="{{ route('admin.jobs.reject', $job->id) }}" method="POST">
                    @csrf
                    <div class="modal-body">
                        <h4 class="text-center  mb-30">@lang('Are you sure to reject this job post?')</h4>
                        <div class="form-group">
                            <label for=""> @lang('Reject reason')</label>
                            <textarea name="reason" class="form-control" required></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn--primary h-45 w-100">@lang('Submit')</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <x-confirmation-modal />
@endsection


@if ($job->status == Status::JOB_PUBLISH && $job->is_approved == Status::NO)
    @push('breadcrumb-plugins')
        <button type="button" class="btn btn-sm btn-outline--success confirmationBtn" data-action="{{ route('admin.jobs.approve', $job->id) }}" data-question="@lang('Are you sure want to approve this job for bidding by active freelancers?')"><i class="las la-check-circle"></i>@lang('Approve')</button>
        <button type="button" class="btn btn-sm btn-outline--danger rejectModalBtn"><i class="las la-ban"></i>@lang('Reject')</button>
    @endpush
@endif

@push('breadcrumb-plugins')
    @if (!$job->bids()->where('status', Status::BID_ACCEPTED)->exists())
        <button type="button" class="btn btn-sm btn-outline--danger confirmationBtn"
            data-action="{{ route('admin.jobs.delete', $job->id) }}"
            data-question="@lang('Are you sure to permanently delete this request and all related quotes?')">
            <i class="las la-trash"></i>@lang('Delete Request')
        </button>
    @endif
@endpush

@push('script')
    <script>
        (function($) {
            "use strict"

            $('.rejectModalBtn').on('click', function() {
                let $modal = $("#rejectModal");
                $modal.modal('show');

            });

        })(jQuery);
    </script>
@endpush



@push('style')
    <style>
        /* Job Item */
        .job-item__top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .job-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #333;
        }

        .job-meta {
            text-align: right;
        }

        .job-time {
            display: block;
            font-size: 0.85rem;
            color: #666;
        }

        /* Project Info */
        .section-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .project-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .project-info__item {
            display: flex;
            align-items: center;
            gap: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 10px;
        }

        .project-icon {
            font-size: 1.5rem;
            color: #0071e3;
        }

        .info-label {
            font-size: 0.9rem;
            color: #555;
            margin-bottom: 0;
        }

        .budget-amount {
            font-size: 1.2rem;
            font-weight: bold;
            color: #28a745;
        }

        /* Skills */
        .skills-section {
            margin-top: 20px;
        }

        .skill-list {
            list-style: none;
            padding: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .skill-item {
            color: #fff;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            .job-item__top {
                flex-direction: column;
                align-items: flex-start;
            }

            .job-meta {
                text-align: left;
                margin-top: 10px;
            }

            .project-info-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Question Section Styling */
        .question-section {
            background: #f8f9fa;
            border: 1px solid #e1e1e1;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .question-header {
            padding-bottom: 8px;
        }

        .question-header h4 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: #333;
        }

        .question-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .question-item {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #fff;
            margin-bottom: 10px;
            padding: 10px 15px;
            border: 1px solid #e1e1e1;
            border-radius: 6px;
            transition: all 0.3s ease;
        }

        .question-item:hover {
            background-color: #e9f5ff;
            border-color: #0071e3;
            transform: translateY(-2px);
        }

        .question-icon {
            font-size: 1.2rem;
            color: #0071e3;
        }

        .question-item span {
            font-size: 1rem;
            color: #333;
        }

        /* Responsive Styling */
        @media (max-width: 768px) {
            .question-header h4 {
                font-size: 1.1rem;
            }

            .question-item {
                font-size: 0.95rem;
                padding: 8px 12px;
            }

            .question-icon {
                font-size: 1rem;
            }
        }
    </style>
@endpush

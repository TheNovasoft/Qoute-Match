<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Education;
use App\Models\User;
use App\Models\Skill;
use App\Models\Portfolio;
use App\Constants\Status;
use Illuminate\Http\Request;
use App\Rules\FileTypeValidate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{

    public function changePassword()
    {
        $pageTitle = 'Change Password';
        return Inertia::render('User/Profile/Password', [
            'pageTitle' => $pageTitle,
            'submitUrl' => route('user.change.password'),
        ]);
    }

    public function submitPassword(Request $request)
    {

        $request->validate([
            'current_password' => 'required',
            'password' => ['required', 'confirmed', \App\Lib\PasswordRules::portal()],
        ]);

        $user = auth()->user();
        if (Hash::check($request->current_password, $user->password)) {
            $user->password = $request->password;
            $user->save();
            $notify[] = ['success', 'Password changed successfully'];
            return back()->withNotify($notify);
        } else {
            $notify[] = ['error', 'The password doesn\'t match!'];
            return back()->withNotify($notify);
        }
    }

    public function skill()
    {
        $user = auth()->user()->load('skills');

        return Inertia::render('User/Profile/Skill', [
            'pageTitle' => 'About & Skills',
            'skills' => Skill::active()->orderBy('name')->get(['id', 'name']),
            'user' => [
                'tagline' => $user->tagline,
                'about' => $user->about,
                'skill_ids' => $user->skills->pluck('id')->values()->all(),
                'step' => (int) $user->step,
            ],
        ]);
    }

    public function submitSkills(Request $request)
    {
        $request->validate([
            'tagline' => 'required|max:255',
            'skill_ids' => 'required|array',
            'skill_ids.*' => 'exists:skills,id',
            'about' => 'required|string',
        ]);

        $user = auth()->user();
        $user->skills()->sync($request->skill_ids);
        $user->tagline = $request->tagline;
        $user->about = $request->about;

        if ($user->step < 1) {
            $user->step = 1;
        }
        $user->save();
        \App\Lib\WorkProfileGate::sync($user->fresh());
        $notify[] = ['success', 'Skills updated successfully. Proceed to the next step.'];
        return to_route('user.profile.setting')->withNotify($notify);
    }


    public function profile()
    {
        $user = auth()->user();

        if ($user->step == 0) {
            return to_route('user.profile.skill');
        }

        $languages = $user->language;
        if (is_object($languages)) {
            $languages = (array) $languages;
        } elseif (! is_array($languages)) {
            $languages = [];
        }

        return Inertia::render('User/Profile/Basic', [
            'pageTitle' => 'Complete Your - Profile Setting',
            'user' => [
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'country_name' => $user->country_name,
                'address' => $user->address,
                'city' => $user->city,
                'state' => $user->state,
                'zip' => $user->zip,
                'language' => array_values(array_filter($languages)),
                'image' => getImage(getFilePath('userProfile') . '/' . $user->image, getFileSize('userProfile')),
                'step' => (int) $user->step,
                'availabilityStatus' => (int) ($user->availability_status ?? \App\Lib\ProviderPresenceService::STATUS_ONLINE),
            ],
            'availabilityOptions' => \App\Lib\ProviderPresenceService::options(),
            'availabilityUrl' => route('user.profile.availability'),
        ]);
    }

    public function updateAvailability(Request $request)
    {
        $request->validate([
            'availability_status' => 'required|integer|in:1,2,3',
        ]);

        $user = auth()->user();
        $user->availability_status = (int) $request->availability_status;
        $user->save();

        $notify[] = ['success', 'Availability status updated.'];
        return back()->withNotify($notify);
    }

    public function submitProfile(Request $request)
    {
        $imageRule = 'nullable';
        $request->validate([
            'firstname'  => 'required|string',
            'lastname'   => 'required|string',
            'language'   => 'required|array|min:1|max:10',
            'language.*' => 'nullable|string',
            'image'       => ["$imageRule", new FileTypeValidate(['jpg', 'jpeg', 'png'])],
        ]);

        $user = auth()->user()->fresh();

        if ($request->hasFile('image')) {
            try {
                $user->image = fileUploader($request->image, getFilePath('userProfile'), getFileSize('userProfile'), @$user->image);
            } catch (\Exception $exp) {
                $notify[] = ['error', 'Couldn\'t upload user image'];
                return back()->withNotify($notify);
            }
        }

        $user->firstname = $request->firstname;
        $user->lastname = $request->lastname;

        $user->address = $request->address;
        $user->city = $request->city;
        $user->state = $request->state;
        $user->zip = $request->zip;
        $user->language = $request->language;

        if ($user->step < 2) {
            $user->step = 2;
        }

        $user->save();
        \App\Lib\WorkProfileGate::sync($user->fresh());
        $notify[] = ['success', 'Basic setting updated successfully.  Proceed to the next step.'];
        return to_route('user.profile.education')->withNotify($notify);
    }

    public function education()
    {
        $user = auth()->user();

        if ($user->step < 1) {
            return to_route('user.profile.setting');
        }

        return Inertia::render('User/Profile/Education', [
            'pageTitle' => 'Complete Your - Education',
            'user' => [
                'step' => (int) $user->step,
            ],
            'educations' => $user->educations()->get()->map(fn ($education) => [
                'id' => $education->id,
                'school' => $education->school,
                'year_from' => $education->year_from,
                'year_to' => $education->year_to,
                'degree' => $education->degree,
                'area_of_study' => $education->area_of_study,
                'description' => $education->description,
            ])->values()->all(),
        ]);
    }


    public function submitEducations(Request $request)
    {
        $request->validate([
            'education.*.school'       => 'required|string|max:255',
            'education.*.year_from'    => 'nullable|string',
            'education.*.year_to'      => 'nullable|string',
            'education.*.degree'       => 'nullable|string|max:255',
            'education.*.area_of_study' => 'nullable|string|max:255',
            'education.*.description'  => 'nullable|string',
        ], [
            'education.*.school.required' => 'The school name is required.',
        ]);
        
        $user = auth()->user()->fresh();
        $updatedIds = [];

        if (!$request->education || empty($request->education)) {
            return back()->with('error', 'Please provide your education qualifications.');
        }

        foreach ($request->education as $educationData) {
            if (!empty($educationData['id'])) {
                $education = $user->educations()->find($educationData['id']);
                if ($education) {
                    $education->school =  $educationData['school'];
                    $education->year_from =  $educationData['year_from'];
                    $education->year_to =  $educationData['year_to'];
                    $education->degree =  $educationData['degree'];
                    $education->area_of_study =  $educationData['area_of_study'];
                    $education->description =  $educationData['description'];
                    $education->save();
                    $updatedIds[] = $education->id;
                }
            } else {
                $education = new Education();
                $education->user_id =   $user->id;
                $education->school =  $educationData['school'];
                $education->year_from =  $educationData['year_from'];
                $education->year_to =  $educationData['year_to'];
                $education->degree =  $educationData['degree'];
                $education->area_of_study =  $educationData['area_of_study'];
                $education->description =  $educationData['description'];
                $education->save();
                $updatedIds[] = $education->id;
            }
        }

        $user->educations()->whereNotIn('id', $updatedIds)->delete();

        if ($user->step < 3) {
            $user->step = 3;
            $user->save();
        }

        return redirect()->route('user.profile.portfolio')->with('success', 'Education updated successfully.');
    }

    public function skipEducation()
    {
        $user = auth()->user();

        if ((int) $user->step < 1) {
            return to_route('user.profile.skill')->withNotify([
                ['error', 'Complete your skills and about section before continuing.'],
            ]);
        }

        if ((int) $user->step < 3) {
            $user->step = 3;
            $user->save();
        }

        return to_route('user.profile.portfolio')->withNotify([
            ['info', 'Education skipped — you can add it later from profile settings.'],
        ]);
    }

    public function skipPortfolio()
    {
        $user = auth()->user()->fresh();

        if ((int) $user->step < 1) {
            return to_route('user.profile.skill')->withNotify([
                ['error', 'Complete your skills and about section before continuing.'],
            ]);
        }

        \App\Lib\WorkProfileGate::sync($user);

        if ((int) $user->fresh()->work_profile_complete !== Status::YES) {
            return back()->withNotify([
                ['error', 'Add your about section, skills, and basic profile details before finishing setup.'],
            ]);
        }

        return to_route('user.home')->withNotify([
            ['success', 'Profile complete — you can start quoting. Add portfolio items anytime from your profile.'],
        ]);
    }






    public function portfolio()
    {
        $user = auth()->user();

        if ($user->step < 2) {
            return to_route('user.profile.education');
        }

        return Inertia::render('User/Profile/Portfolio', [
            'pageTitle' => 'Complete Your - Portfolios',
            'user' => [
                'step' => (int) $user->step,
            ],
            'workProfileComplete' => (bool) $user->work_profile_complete,
            'skills' => Skill::active()->orderBy('name')->get(['id', 'name']),
            'portfolios' => $user->portfolios()->latest()->get()->map(fn ($portfolio) => [
                'id' => $portfolio->id,
                'title' => $portfolio->title,
                'role' => $portfolio->role,
                'description' => $portfolio->description,
                'item_type' => $portfolio->item_type ?? 'project',
                'skill_ids' => $portfolio->skill_ids ?? [],
                'status' => (bool) $portfolio->status,
                'image' => getImage(getFilePath('portfolio') . '/' . $portfolio->image, getFileSize('portfolio')),
            ])->values()->all(),
        ]);
    }

    public function submitPortfolios(Request $request, $id = 0)
    {
        $user = auth()->user();
        $imageRule = $id ? 'nullable' : 'required';

        $request->validate([
            'title'        => 'required|string',
            'role'         => 'nullable|string',
            'description'  => 'required|string',
            'item_type'    => 'required|in:project,certificate',
            'skill_ids'   => 'required|array',
            'skill_ids.*' => 'exists:skills,id',
            'image'       => ["$imageRule", new FileTypeValidate(['jpg', 'jpeg', 'png'])],
        ]);

        if ($id) {
            $portfolio = Portfolio::where('user_id', $user->id)->findOrFail($id);
            $notification = 'Portfolio updated successfully';
        } else {
            $portfolio = new Portfolio();
            $notification = 'Portfolio added successfully';
        }

        if ($request->hasFile('image')) {
            try {
                $portfolio->image = fileUploader($request->image, getFilePath('portfolio'), getFileSize('portfolio'), @$portfolio->image);
            } catch (\Exception $exp) {
                $notify[] = ['error', 'Couldn\'t upload portfolio image'];
                return back()->withNotify($notify);
            }
        }

        $portfolio->user_id     = $user->id;
        $portfolio->item_type   = $request->item_type;
        $portfolio->title       = $request->title;
        $portfolio->role        = $request->role;
        $portfolio->description = $request->description;
        $portfolio->skill_ids   = $request->skill_ids;
        $portfolio->save();

        if ($user->step < 4) {
            $user->step = 4;
        }

        $user->save();
        \App\Lib\WorkProfileGate::sync($user->fresh());
        $user = $user->fresh();

        $notify[] = ['success', $user->work_profile_complete
            ? 'Portfolio saved. Your profile is live — you can start bidding!'
            : $notification];
        return back()->withNotify($notify);
    }

    public function statusPortfolio($id)
    {
        return Portfolio::changeStatus($id);
    }

    public function workProfileComplete()
    {
        $user = auth()->user();
        $id  = $user->id;
        return User::changeStatus($id, 'work_profile_complete');
    }
}

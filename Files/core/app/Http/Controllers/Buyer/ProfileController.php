<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Lib\AccountResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use App\Rules\FileTypeValidate;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function profile()
    {
        $pageTitle = "Profile Setting";
        $user = auth()->guard('buyer')->user();
        return Inertia::render('Buyer/Profile/Settings', [
            'pageTitle' => $pageTitle,
            'profile' => AccountResource::buyerProfile($user),
        ]);
    }

    public function submitProfile(Request $request)
    {
        $imageRule = 'nullable';
        $request->validate([
            'firstname' => 'required|string',
            'lastname' => 'required|string',
            'language'   => 'required|array|min:1|max:10',
            'language.*' => 'nullable|string',
            'image'       => ["$imageRule", new FileTypeValidate(['jpg', 'jpeg', 'png'])],
        ],[
            'firstname.required'=>'The first name field is required',
            'lastname.required'=>'The last name field is required'
        ]);

        $user = auth()->guard('buyer')->user();

        if ($request->hasFile('image')) {
            try {
                $user->image = fileUploader($request->image, getFilePath('buyerProfile'), getFileSize('buyerProfile'), @$user->image);
            } catch (\Exception $exp) {
                $notify[] = ['error', 'Couldn\'t upload your image'];
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

        $user->save();
        $notify[] = ['success', 'Profile updated successfully'];
        return back()->withNotify($notify);
    }

    public function changePassword()
    {
        $pageTitle = 'Change Password';
        return Inertia::render('Buyer/Profile/Password', [
            'pageTitle' => $pageTitle,
            'submitUrl' => route('buyer.change.password'),
        ]);
    }

    public function submitPassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => ['required', 'confirmed', \App\Lib\PasswordRules::portal()],
        ]);

        $user = auth()->guard('buyer')->user();
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
}

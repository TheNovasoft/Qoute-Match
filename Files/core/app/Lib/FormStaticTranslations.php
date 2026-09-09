<?php

namespace App\Lib;

class FormStaticTranslations
{
    /** @var array<string, array<string, string>>|null */
    private static ?array $maps = null;

    public static function get(string $to, string $text): ?string
    {
        $map = self::maps()[strtolower($to)] ?? null;

        if ($map === null) {
            return null;
        }

        $translation = $map[$text] ?? null;

        return is_string($translation) && $translation !== '' ? $translation : null;
    }

    /**
     * @param  array<int, string>  $texts
     * @return array<string, string>
     */
    public static function getMany(string $to, array $texts): array
    {
        $hits = [];

        foreach ($texts as $text) {
            $translation = self::get($to, $text);

            if ($translation !== null && $translation !== $text) {
                $hits[$text] = $translation;
            }
        }

        return $hits;
    }

    /**
     * @return array<string, array<string, string>>
     */
    private static function maps(): array
    {
        if (self::$maps !== null) {
            return self::$maps;
        }

        self::$maps = [
            'ur' => self::urduMap(),
            'ar' => self::arabicMap(),
            'hi' => self::hindiMap(),
        ];

        return self::$maps;
    }

    /**
     * @return array<string, string>
     */
    private static function urduMap(): array
    {
        return [
            'Tell us what you need done' => 'ہمیں بتائیں آپ کو کیا کروانا ہے',
            'Answer a few questions — your previous answers stay visible below and can be edited anytime.' => 'چند سوالات کے جواب دیں — آپ کے پچھلے جواب نیچے نظر آتے رہیں گے اور کسی بھی وقت ترمیم کی جا سکتی ہے۔',
            'What do you need help with?' => 'آپ کو کس چیز میں مدد چاہیے؟',
            'Choose the category that best matches your job.' => 'وہ زمرہ منتخب کریں جو آپ کی نوکری سے بہترین ملے۔',
            'Job title' => 'نوکری کا عنوان',
            'Job description' => 'نوکری کی تفصیل',
            'From' => 'سے',
            'To' => 'تک',
            'Country' => 'ملک',
            'City' => 'شہر',
            'Select country' => 'ملک منتخب کریں',
            'Select city' => 'شہر منتخب کریں',
            'Select a country first' => 'پہلے ملک منتخب کریں',
            'Enter city' => 'شہر درج کریں',
            'Your name' => 'آپ کا نام',
            'Email' => 'ای میل',
            'Phone (optional)' => 'فون (اختیاری)',
            'Already a member?' => 'پہلے سے رکن ہیں؟',
            'Log in to your account' => 'اپنے اکاؤنٹ میں لاگ ان کریں',
            'Container type' => 'کنٹینر کی قسم',
            'Full Container (FCL)' => 'مکمل کنٹینر (FCL)',
            'LCL (Less than Container Load)' => 'LCL (کنٹینر لوڈ سے کم)',
            'LCL packing' => 'LCL پیکنگ',
            'Same products' => 'یکساں مصنوعات',
            'Multiple different products' => 'مختلف مصنوعات',
            'Add box' => 'باکس شامل کریں',
            'Box' => 'باکس',
            'HS code' => 'HS کوڈ',
            'Weight (kg)' => 'وزن (kg)',
            'Continue' => 'جاری رکھیں',
            'Edit' => 'ترمیم',
            'Posting…' => 'پوسٹ ہو رہا ہے…',
            'Post job' => 'نوکری پوسٹ کریں',
            'Post job free' => 'مفت نوکری پوسٹ کریں',
            'Original' => 'اصل',
            'Could not translate. Try again.' => 'ترجمہ نہیں ہو سکا۔ دوبارہ کوشش کریں۔',
            'Translation service is busy. Form labels are shown in Urdu where available.' => 'ترجمہ سروس مصروف ہے۔ دستیاب جگہوں پر فارم لیبلز اردو میں دکھائے جا رہے ہیں۔',
            'Please choose a category.' => 'براہ کرم ایک زمرہ منتخب کریں۔',
            'Please choose a speciality.' => 'براہ کرم ایک speciality منتخب کریں۔',
            'Job title is required.' => 'نوکری کا عنوان ضروری ہے۔',
            'Job title must be at least 3 characters.' => 'نوکری کا عنوان کم از کم 3 حروف کا ہونا چاہیے۔',
            'Job title must be 255 characters or less.' => 'نوکری کا عنوان 255 حروف یا اس سے کم ہونا چاہیے۔',
            'Job description is required.' => 'نوکری کی تفصیل ضروری ہے۔',
            'Please add a bit more detail (at least 20 characters).' => 'براہ کرم مزید تفصیل شامل کریں (کم از کم 20 حروف)۔',
            'Your name is required.' => 'آپ کا نام ضروری ہے۔',
            'Name must be 40 characters or less.' => 'نام 40 حروف یا اس سے کم ہونا چاہیے۔',
            'Email is required.' => 'ای میل ضروری ہے۔',
            'Please enter a valid email address.' => 'براہ کرم درست ای میل درج کریں۔',
            'Email must be 100 characters or less.' => 'ای میل 100 حروف یا اس سے کم ہونی چاہیے۔',
            'Phone must be 30 characters or less.' => 'فون 30 حروف یا اس سے کم ہونا چاہیے۔',
            'Please select a country.' => 'براہ کرم ملک منتخب کریں۔',
            'Please select or enter a city.' => 'براہ کرم شہر منتخب یا درج کریں۔',
            'Please select an origin country.' => 'براہ کرم اصل ملک منتخب کریں۔',
            'Please select or enter an origin city.' => 'براہ کرم اصل شہر منتخب یا درج کریں۔',
            'Please select a destination country.' => 'براہ کرم منزل کا ملک منتخب کریں۔',
            'Please select or enter a destination city.' => 'براہ کرم منزل کا شہر منتخب یا درج کریں۔',
            'Please choose a container type.' => 'براہ کرم کنٹینر کی قسم منتخب کریں۔',
            'HS code is required.' => 'HS کوڈ ضروری ہے۔',
            'Please enter a valid HS code.' => 'براہ کرم درست HS کوڈ درج کریں۔',
            'Weight is required.' => 'وزن ضروری ہے۔',
            'Please enter a valid weight in kg.' => 'براہ کرم درست وزن (kg) درج کریں۔',
            'Please enter cargo dimensions or volume.' => 'براہ کرم کارگو کے سائز یا حجم درج کریں۔',
            'Please choose at least one option.' => 'براہ کرم کم از کم ایک آپشن منتخب کریں۔',
            'Please choose an option.' => 'براہ کرم ایک آپشن منتخب کریں۔',
            'Please attach a file.' => 'براہ کرم فائل منسلک کریں۔',
            'This field is required.' => 'یہ خانہ ضروری ہے۔',
            'Please enter a valid number.' => 'براہ کرم درست نمبر درج کریں۔',
            'Please choose a date.' => 'براہ کرم تاریخ منتخب کریں۔',
            'Please enter a valid date.' => 'براہ کرم درست تاریخ درج کریں۔',
            'Please enter at least 2 characters.' => 'براہ کرم کم از کم 2 حروف درج کریں۔',
            'Please enter dimensions or volume.' => 'براہ کرم سائز یا حجم درج کریں۔',
            'Please enter a valid URL (starting with http:// or https://).' => 'براہ کرم درست URL درج کریں (http:// یا https:// سے شروع)۔',
            'Inputs' => 'ان پٹ',
            'Mode: Cubic Meter (m³)' => 'موڈ: مکعب میٹر (m³)',
            'UOM' => 'پیمائش کی اکائی',
            'Length' => 'لمبائی',
            'Width' => 'چوڑائی',
            'Height' => 'اونچائی',
            'Weight' => 'وزن',
            'Unit' => 'اکائی',
            'Qty' => 'تعداد',
            'Results' => 'نتائج',
            'Calculating…' => 'حساب لگایا جا رہا ہے…',
            'Live calculation unavailable. Showing local estimate.' => 'لائیو حساب دستیاب نہیں۔ مقامی تخمینہ دکھایا جا رہا ہے۔',
            'Volume (Cubic Meter)' => 'حجم (مکعب میٹر)',
            'Volume (Cubic Feet)' => 'حجم (مکعب فٹ)',
            'Weight (Kg)' => 'وزن (Kg)',
            'Weight (lb)' => 'وزن (lb)',
            'Volumetric Weight Sea (Kg)' => 'بحری volumetric وزن (Kg)',
            'Volumetric Weight Sea (lb)' => 'بحری volumetric وزن (lb)',
            'Volumetric Weight Air (Kg)' => 'فضائی volumetric وزن (Kg)',
            'Volumetric Weight Air (lb)' => 'فضائی volumetric وزن (lb)',
            '20 Feet Container' => '20 فٹ کنٹینر',
            '40 Feet Container' => '40 فٹ کنٹینر',
            '40 Feet HC Container' => '40 فٹ HC کنٹینر',
            'Enter length, width, and height to calculate CBM, volumetric weight, and container capacity.' => 'CBM، volumetric وزن اور کنٹینر capacity کے لیے لمبائی، چوڑائی اور اونچائی درج کریں۔',
            'Sea freight volumetric weight uses L × W × H (cm) ÷ 5000. Air freight uses ÷ 6000. Container counts use standard shipping container dimensions.' => 'Sea freight volumetric وزن: L × W × H (cm) ÷ 5000۔ Air freight: ÷ 6000۔ کنٹینر گنتی معیاری shipping کنٹینر سائز پر مبنی ہے۔',
            'L cm' => 'L سم',
            'W cm' => 'W سم',
            'H cm' => 'H سم',
            'units' => 'یونٹس',
            'mm' => 'mm',
            'cm' => 'cm',
            'meter' => 'میٹر',
            'Kg' => 'Kg',
            'Gm' => 'Gm',
            'Which speciality fits your job?' => 'آپ کی نوکری کے لیے کون سا شعبہ مناسب ہے؟',
            'Pick the closest match.' => 'سب سے قریبی آپشن منتخب کریں۔',
            'Tell us about your cargo' => 'اپنے کارگو کے بارے میں بتائیں',
            'Container type, HS code, weight and dimensions help providers quote accurately.' => 'کنٹینر کی قسم، HS کوڈ، وزن اور سائز فراہم کنندگان کو درست قیمت دینے میں مدد کرتے ہیں۔',
            'Where is the shipment going?' => 'شپمنٹ کہاں جا رہی ہے؟',
            'Where is this shipment coming from?' => 'یہ شپمنٹ کہاں سے آ رہی ہے؟',
            'Where should this shipment go?' => 'یہ شپمنٹ کہاں جانی چاہیے؟',
            'Select the country first, then the city.' => 'پہلے ملک، پھر شہر منتخب کریں۔',
            'Job title & description' => 'نوکری کا عنوان اور تفصیل',
            'Review the suggested title and description — edit either if you like.' => 'تجویز کردہ عنوان اور تفصیل دیکھیں — چاہیں تو ترمیم کریں۔',
            'Your contact details' => 'آپ کی رابطہ تفصیلات',
            'We\'ll use this to create your account when you publish — no password needed here. Already a member? Log in instead.' => 'پبلش کرتے وقت آپ کا اکاؤنٹ بنانے کے لیے استعمال ہوگا — یہاں پاس ورڈ کی ضرورت نہیں۔ پہلے سے رکن ہیں؟ لاگ ان کریں۔',
            'Review and post' => 'جائزہ لیں اور پوسٹ کریں',
            'Check everything looks right, then post your job.' => 'سب کچھ درست ہے تو اپنی نوکری پوسٹ کریں۔',
            'File attached' => 'فائل منسلک',
            '0 skill(s) selected' => '0 مہارت منتخب',
            'Builders and Home Improvement' => 'بلڈرز اور گھر کی بہتری',
            'General building work' => 'عمومی تعمیراتی کام',
            'Extensions' => 'توسیع',
            'Loft conversions' => 'لیفٹ/علاوہ تبدیلی',
            'House renovation' => 'گھر کی مرمت',
            'Kitchen fitting' => 'باورچی خانے کی فٹنگ',
            'Bathroom fitting' => 'باتھ روم کی فٹنگ',
            'Joinery and carpentry' => 'بڑھئی اور کارپینٹری',
            'Painting and decorating' => 'پینٹنگ اور سجاوٹ',
            'Plastering' => 'پلستر',
            'Roofing' => 'چھت کا کام',
            'Plumbing' => 'پلمبنگ',
            'Electrical work' => 'بجلی کا کام',
            'Flooring' => 'فرش',
            'Windows and doors' => 'کھڑکیاں اور دروازے',
            'Landscaping' => 'لینڈ اسکیپنگ',
            'Driveways' => 'ڈرائیویز',
            'Demolition' => 'منہدم کرنا',
            'Waste removal' => 'فضلہ ہٹانا',
            'Air conditioning and heat pump installat' => 'ائیر کنڈیشننگ اور ہیٹ پمپ انسٹالیشن',
            'Stairs and bespoke joinery' => 'سیڑhیاں اور خصوصی بڑھئی کام',
            'Freight Forwarding and Logistics' => 'فریٹ فارورڈنگ اور لاجسٹکس',
            'Air freight' => 'ہوائی فریٹ',
            'Sea freight' => 'بحری فریٹ',
            'Road freight' => 'سڑک فریٹ',
            'Customs clearance' => 'کسٹم کلیئرنس',
            'Import services' => 'درآمد کی خدمات',
            'Export service' => 'برآمد کی خدمت',
            'Pallet delivery' => 'پیلیٹ کی ترسیل',
            'Container delivery' => 'کنٹینر کی ترسیل',
            'Warehousing' => 'گودام',
            'Fulfilment' => 'تکمیل',
            'Amazon FBA delivery' => 'Amazon FBA ترسیل',
            'Tail lift delivery' => 'ٹیل لفٹ ترسیل',
            'Heavy goods delivery' => 'بھاری سامان کی ترسیل',
            'Courier service' => 'کورئیر سروس',
            'Duty deferment service' => 'ڈیوٹی ملتوی سروس',
            'DDP/DDU shipping' => 'DDP/DDU شپنگ',
            'Pallet exchange service' => 'پیلیٹ ایکسچینج سروس',
            'Postcode' => 'پوسٹ کوڈ',
            'Where is the project located?' => 'پروجیکٹ کہاں واقع ہے؟',
            'Property Type' => 'پراپرٹی کی قسم',
            'House' => 'مکان',
            'Flat' => 'فلیٹ',
            'Bungalow' => 'بنگلو',
            'Commercial' => 'تجارتی',
            'Other' => 'دیگر',
            'Project Timeline' => 'پروجیکٹ کا وقت',
            'ASAP' => 'جلد از جلد',
            'Within 1 month' => '1 ماہ کے اندر',
            '1-3 months' => '1-3 ماہ',
            '3-6 months' => '3-6 ماہ',
            'Flexible' => 'لچکدار',
            'Additional Requirements' => 'اضافی ضروریات',
            'Access restrictions, materials preferences, or other notes' => 'رسائی کی پابندیاں، مواد کی ترجیحات، یا دیگر نوٹس',
            'Origin Country' => 'اصل ملک',
            'Origin City' => 'اصل شہر',
            'Destination Country' => 'منزل کا ملک',
            'Destination City' => 'منزل کا شہر',
            'Harmonized System code for your goods (e.g. 8471.30)' => 'اپنے سامان کا HS کوڈ (مثلاً 8471.30)',
            'Gross Weight kg' => 'کل وزن (kg)',
            'Approximate total weight in kilograms' => 'کلوگرام میں تقریبی کل وزن',
            'Full Container' => 'مکمل کنٹینر',
            'LCL' => 'LCL',
            'Full Container (FCL) for a whole container, or LCL for a shared load.' => 'مکمل کنٹینر (FCL) یا مشترکہ لوڈ کے لیے LCL۔',
            'Dimensions CBM' => 'سائز CBM',
            'Enter package dimensions to calculate cubic metres (CBM).' => 'مکعب میٹر (CBM) کے لیے پیکج کے سائز درج کریں۔',
            'Your project is ready' => 'آپ کا پروجیکٹ تیار ہے',
            'We saved your job details. Create a free account or log in to publish your project and start receiving quotes from providers.' => 'ہم نے آپ کی نوکری کی تفصیلات محفوظ کر لی ہیں۔ مفت اکاؤنٹ بنائیں یا لاگ ان کر کے پروجیکٹ شائع کریں اور فراہم کنندگان سے کوٹس حاصل کریں۔',
            'Your email' => 'آپ کی ای میل',
            'will be used for your account.' => 'آپ کے اکاؤنٹ کے لیے استعمال ہوگی۔',
            'Your job has been posted' => 'آپ کی نوکری پوسٹ ہو گئی',
            'Your job has been saved as a draft. Log in to your customer dashboard to publish it when you are ready.' => 'آپ کی نوکری ڈرافٹ کے طور پر محفوظ ہے۔ تیار ہونے پر شائع کرنے کے لیے کسٹمر ڈیش بورڈ میں لاگ ان کریں۔',
            'Your request is live on Find Jobs. Providers can now send you quotes. Check your email for confirmation and manage everything from your customer account.' => 'آپ کی درخواست Find Jobs پر لائیو ہے۔ فراہم کنندگان اب کوٹس بھیج سکتے ہیں۔ تصدیق کے لیے ای میل دیکھیں اور کسٹمر اکاؤنٹ سے سب کچھ منظم کریں۔',
            'Thanks — your request is in review. You will get an email as soon as it is approved and appears on Find Jobs. Manage it anytime from your customer account.' => 'شکریہ — آپ کی درخواست جائزے میں ہے۔ منظوری کے بعد ای میل موصول ہوگی۔ کسی بھی وقت کسٹمر اکاؤنٹ سے منظم کریں۔',
            'Create free account' => 'مفت اکاؤنٹ بنائیں',
            'Log in' => 'لاگ ان',
            'View my jobs' => 'میری نوکریاں دیکھیں',
            'Browse requests' => 'درخواستیں دیکھیں',
            'Back to home' => 'ہوم پر واپس',
        ];
    }

    /**
     * @return array<string, string>
     */
    private static function arabicMap(): array
    {
        return [
            'Tell us what you need done' => 'أخبرنا بما تريد إنجازه',
            'Job title' => 'عنوان الوظيفة',
            'Job description' => 'وصف الوظيفة',
            'Continue' => 'متابعة',
            'Edit' => 'تعديل',
            'Country' => 'البلد',
            'City' => 'المدينة',
            'From' => 'من',
            'To' => 'إلى',
            'Post job' => 'نشر الوظيفة',
            'Post job free' => 'نشر الوظيفة مجاناً',
        ];
    }

    /**
     * @return array<string, string>
     */
    private static function hindiMap(): array
    {
        return [
            'Tell us what you need done' => 'हमें बताएं आपको क्या करवाना है',
            'Job title' => 'नौकरी का शीर्षक',
            'Job description' => 'नौकरी का विवरण',
            'Continue' => 'जारी रखें',
            'Edit' => 'संपादित करें',
            'Country' => 'देश',
            'City' => 'शहर',
            'From' => 'से',
            'To' => 'तक',
            'Post job' => 'नौकरी पोस्ट करें',
            'Post job free' => 'मुफ्त नौकरी पोस्ट करें',
        ];
    }
}

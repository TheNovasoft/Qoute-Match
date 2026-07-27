<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Traits\SupportTicketManager;

class TicketController extends Controller {

    use SupportTicketManager;

    public function __construct() {
        $this->redirectLink = 'buyer.ticket.view';
        $this->userType = 'buyer';
        $this->column = 'buyer_id';
        $this->user = auth()->guard('buyer')->user();
        if ($this->user) {
            $this->layout = 'buyer_master';
        }
    }


}

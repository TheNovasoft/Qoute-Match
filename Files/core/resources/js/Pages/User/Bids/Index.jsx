import { usePage } from '@inertiajs/react';
import MasterLayout from '@/Components/Layout/MasterLayout';
import BidList from '@/Components/Shared/BidList';

export default function Index({ pageTitle, bids }) {
    const { routes } = usePage().props;

    return (
        <MasterLayout pageTitle={pageTitle}>
            <BidList bids={bids} indexUrl={routes.userBidIndex ?? '/provider/bid/index'} />
        </MasterLayout>
    );
}

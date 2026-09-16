import { SchedulingBookingDetail } from "@/modules/scheduling/ui/booking-detail";
export default async function Page({ params }: { params: Promise<{ bookingId: string }> }) {
  return <SchedulingBookingDetail id={(await params).bookingId} />;
}

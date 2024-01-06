import { CloudIcon } from '@heroicons/react/24/outline';
import { inter } from '@/app/ui/fonts';

export default function AcmeLogo() {
  return (
    <div
      className={`${inter.className} flex flex-row items-center leading-none text-white`}
    >
      <CloudIcon className="h-12 w-12" />
      <p className="ml-2 text-[26px] font-bold">Bespokel</p>
    </div>
  );
}

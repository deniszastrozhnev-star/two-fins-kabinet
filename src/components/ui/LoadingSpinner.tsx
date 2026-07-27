/** Мгновенный визуальный отклик на переход между вкладками раздела —
 * рендерится в Suspense fallback из loading.tsx, пока страница грузит данные. */
export function LoadingSpinner() {
  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-cyan/20 border-t-brand-cyan" />
    </div>
  );
}

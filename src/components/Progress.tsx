import { useRecoilValue } from 'recoil';
import 'twin.macro';

import { accountListAtom, progressAtom } from 'src/utils/atoms';

const Progress = () => {
  const { status, amountComplete } = useRecoilValue(progressAtom);
  const accountList = useRecoilValue(accountListAtom);

  return (
    <div tw="flex justify-center relative bg-dark rounded p-1 z-0">
      <div
        tw="absolute inset-0 rounded bg-gradient-to-b from-green-500 to-green-800 z-index[-1]"
        style={{
          width:
            accountList.length > 0
              ? `${(amountComplete / accountList.length) * 100}%`
              : 0,
        }}
      />
      <p>
        {status === 'loading'
          ? `Loading: ${amountComplete}/${accountList.length}`
          : status === 'complete'
          ? 'Complete'
          : 'Progress'}
      </p>
    </div>
  );
};

export default Progress;
import { useState } from 'react';
import { parse } from 'papaparse';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { StrKey } from 'stellar-base';
import tw from 'twin.macro';

import {
  accountListAtom,
  progressAtom,
  settingsAtom,
  xdrListAtom,
} from 'src/utils/atoms';
import { generateXdr, parseError } from 'src/utils/utils';
import Progress from './Progress';

const FileUpload = () => {
  const [invalidRows, setInvalidRows] = useState<{ row: number }[]>([]);
  const setAccountList = useSetRecoilState(accountListAtom);
  const setXdrList = useSetRecoilState(xdrListAtom);
  const setProgress = useSetRecoilState(progressAtom);

  const { publicKey, amount } = useRecoilValue(settingsAtom);

  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File>();

  const parseFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    setIsLoading(true);
    const csvFile = e.target.files?.[0];
    if (!csvFile) return;

    setFile(csvFile);
    const reader = new FileReader();

    const csvText = await new Promise<any>((resolve) => {
      reader.onload = (e) => {
        resolve(e.target?.result);
      };
      reader.readAsText(csvFile);
    });

    const csvData = parse(csvText, { header: true }) as any;

    setAccountList(csvData.data);
    setIsLoading(false);

    setProgress((oldState) => ({ ...oldState, status: 'loading' }));

    let generator = generateXdr(publicKey, amount, csvData.data);
    try {
      for await (let { xdr, amountComplete, isInvalid } of generator) {
        if (xdr) setXdrList((oldState) => [...oldState, xdr!]);

        if (isInvalid) {
          setInvalidRows((oldState) => [...oldState, { row: amountComplete }]);
        }

        setProgress((oldState) => ({
          ...oldState,
          amountComplete,
        }));
      }
    } catch (e) {
      setProgress((oldState) => ({
        ...oldState,
        status: 'error',
        error: parseError(e),
      }));
    }

    setProgress((oldState) => ({ ...oldState, status: 'complete' }));
  };

  return (
    <div tw="space-y-2">
      <label tw="block">
        <input
          type="file"
          multiple={false}
          accept=".csv"
          onChange={parseFile}
          tw="hidden invisible opacity-0 disabled:sibling:(cursor-not-allowed bg-black bg-opacity-20)"
          disabled={
            isLoading || !!file || !StrKey.isValidEd25519PublicKey(publicKey)
          }
        />
        <StyledFileUpload>
          {isLoading ? '✋ Loading' : !!file ? '✔️ Uploaded' : '🗂️ Upload'}
        </StyledFileUpload>
      </label>

      <Progress />

      {invalidRows.length > 0 && (
        <div>
          <p>Invalid key found in row:</p>
          <ul tw="flex flex-wrap gap-4">
            {invalidRows.map(({ row }) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const StyledFileUpload = tw.p`flex items-center justify-center p-4 cursor-pointer rounded font-bold bg-secondary transition-colors`;

export default FileUpload;

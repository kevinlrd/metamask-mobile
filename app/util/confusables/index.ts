/* eslint-disable @typescript-eslint/no-explicit-any -- TODO: Add declarations for the legacy confusables package. */
// @ts-expect-error TS(7016): Could not find a declaration file for module 'unic... Remove this comment to see the full error message
import { confusables } from 'unicode-confusables';
import { strings } from '../../../locales/i18n';
import confusablesMap from 'unicode-confusables/data/confusables.json';

export const collectConfusables = (ensName: any) => {
  const key = 'similarTo';
  const collection = confusables(ensName).reduce(
    (total: any, current: any) =>
      key in current ? [...total, current.point] : total,
    [],
  );
  return collection;
};

const zeroWidthPoints = new Set([
  '\u200b', // zero width space
  '\u200c', // zero width non-joiner
  '\u200d', // zero width joiner
  '\ufeff', // zero width no-break space
  '\u2028', // line separator
  '\u2029', // paragraph separator,
]);

export const hasZeroWidthPoints = (char: any) => zeroWidthPoints.has(char);

export const getConfusablesExplanations = (confusableCollection: any) => [
  ...new Set(
    confusableCollection.map((key: any) => {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      const value = confusablesMap[key];
      return hasZeroWidthPoints(key)
        ? strings('transaction.contains_zero_width')
        : `'${key}' ${strings('transaction.similar_to')} '${value}'`;
    }),
  ),
];

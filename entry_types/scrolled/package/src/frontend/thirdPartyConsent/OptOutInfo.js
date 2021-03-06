import React, {useContext} from 'react';
import classNames from 'classnames';

import {ThirdPartyConsentContext} from './ThirdPartyConsentProvider';
import {useTheme} from '../../entryState';
import {useI18n} from '../i18n';
import {useContentElementEditorState} from 'pageflow-scrolled/frontend';
import {useIsStaticPreview} from '../useScrollPositionLifecycle';

import styles from './OptOutInfo.module.css';
import InfoIcon from '../icons/information.svg'

/**
 * Display info tooltip with a link to opt out of third party
 * embeds. Opt out url needs to be configured in theme options.
 *
 * @param {Object} props
 * @param {string} props.providerName -
 *   Only display if user has given consent for this provider.
 * @param {string} props.contentElementPosition -
 *   Position setting of parent content element. Used to correctly place
 *   tooltip when content element uses full width.
 * @param {boolean} [hide] -
 *   Temporarily hide the tooltip, e.g. while the embed is playing
 *
 * @name ThirdPartyOptOutInfo
 */
export function OptOutInfo({
  providerName,
  hide,
  contentElementPosition
}) {
  const {t} = useI18n();
  const {isEditable} = useContentElementEditorState();
  const isStaticPreview = useIsStaticPreview();
  const {consents} = useContext(ThirdPartyConsentContext);
  const theme = useTheme();
  const optOutUrl = theme.options.thirdPartyConsent?.optOutUrl;

  if (!consents ||
      !optOutUrl ||
      (!isEditable && !isStaticPreview && !consents[providerName])) {
    return null;
  }

  const linkText = t('pageflow_scrolled.public.third_party_consent.opt_out.prompt_link');
  const linkHtml = `<a href="${optOutUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
  const html = t('pageflow_scrolled.public.third_party_consent.opt_out.prompt', {link: linkHtml});

  return (
    <div className={classNames(styles.optOut, styles[contentElementPosition])}
         style={hide ? {opacity: 0, visibility: 'hidden'} : undefined}>
      <button className={styles.icon}>
        <InfoIcon/>
      </button>
      <div className={styles.tooltip}>
        <div dangerouslySetInnerHTML={{__html: html}} />
      </div>
    </div>
  );
};

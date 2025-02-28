import {
  EdgeCityFolderName,
  FrogCryptoFolderName
} from "@pcd/passport-interface";
import _ from "lodash";
import prettyMilliseconds from "pretty-ms";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import styled, {
  CSSProperties,
  FlattenSimpleInterpolation,
  css,
  keyframes
} from "styled-components";
import { usePCDsInFolder, useSubscriptions } from "../../../src/appHooks";
import { useUserFeedState } from "./FrogCryptoHomeSection";

/**
 * Render the FrogCrypto folder in the home screen.
 *
 * The component currently checks if the game is on via any of the following:
 * 1. User already has active FrogCrypto subscriptions
 * 2. We can find any public and active FrogCrypto feeds
 * 3. The hard coded countdown date has passed
 *
 * Note: We will always flip the game on before the countdown date. The game on
 * logic is temporary and we will remove it once the game is live.
 */
export function FrogFolder({
  onFolderClick,
  Container
}: {
  onFolderClick: (folder: string) => void;
  Container: React.ComponentType<
    PropsWithChildren<{
      style: CSSProperties;
      onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
    }>
  >;
}): JSX.Element {
  const edgePCDs = usePCDsInFolder(EdgeCityFolderName);
  const frogcryptoDisabled = edgePCDs.length === 0;
  const fetchTimestamp = useFetchTimestamp();

  return (
    <Container
      style={
        frogcryptoDisabled
          ? {
              filter: "grayscale(100%)",
              cursor: "default"
            }
          : {}
      }
      onClick={(): void => {
        if (!frogcryptoDisabled) onFolderClick(FrogCryptoFolderName);
      }}
    >
      <img
        draggable="false"
        src="/images/frogs/pixel_frog.png"
        width={18}
        height={18}
      />
      <SuperFunkyFont>
        {frogcryptoDisabled ? (
          <DisabledText>{FrogCryptoFolderName}</DisabledText>
        ) : (
          FrogCryptoFolderName.split("").map((letter, i) => (
            <BounceText key={i} delay={i * 0.1}>
              {letter}
            </BounceText>
          ))
        )}
      </SuperFunkyFont>
      {(typeof fetchTimestamp === "number" || frogcryptoDisabled) && (
        <NewFont $disabled={frogcryptoDisabled}>
          <CountDown
            timestamp={fetchTimestamp}
            frogcryptoDisabled={frogcryptoDisabled}
          />
        </NewFont>
      )}
    </Container>
  );
}

/**
 * Return when user can fetch next.
 */
function useFetchTimestamp(): number | null {
  const { value: subs } = useSubscriptions();
  const frogSubs = useMemo(
    () =>
      subs
        .getActiveSubscriptions()
        .filter((sub) => sub.providerUrl.includes("frogcrypto")),
    [subs]
  );
  const { userState } = useUserFeedState(frogSubs);

  return useMemo(() => {
    try {
      if (!userState) {
        return null;
      }

      // if user has no feeds, they can fetch now
      if (userState.feeds.length === 0) {
        return Date.now();
      }

      const activeFeeds = userState.feeds.filter((feed) => feed.active);
      if (activeFeeds.length === 0) {
        return null;
      }

      return _.min(activeFeeds.map((feed) => feed.nextFetchAt));
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [userState]);
}

/**
 * A countdown to a hard coded game start date.
 */
function CountDown({
  timestamp,
  frogcryptoDisabled
}: {
  timestamp: number;
  frogcryptoDisabled: boolean;
}): JSX.Element {
  const end = useMemo(() => {
    return new Date(timestamp);
  }, [timestamp]);
  const [diffText, setDiffText] = useState(
    frogcryptoDisabled
      ? _.upperCase("Returning Soon")
      : timestamp < Date.now()
      ? _.upperCase("Available Now")
      : ""
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diffMs = end.getTime() - now.getTime();
      if (frogcryptoDisabled) {
        setDiffText(_.upperCase("Returning Soon"));
      } else if (diffMs < 0) {
        setDiffText(_.upperCase("Available Now"));
      } else {
        const diffString = prettyMilliseconds(diffMs, {
          millisecondsDecimalDigits: 0,
          secondsDecimalDigits: 0,
          unitCount: 4
        });
        setDiffText(diffString);
      }
    }, 1000 / 30);

    return () => {
      clearInterval(interval);
    };
  }, [end, frogcryptoDisabled]);

  return <>{diffText}</>;
}

export const NewFont = styled.div<{ $disabled?: boolean }>`
  font-size: 14px;
  font-family: monospace;
  margin-left: auto;

  ${({ $disabled }): FlattenSimpleInterpolation =>
    !$disabled
      ? css`
          animation: color-change 1s infinite;
        `
      : css`
          color: #ff9900; // Static color when disabled
        `}

  @keyframes color-change {
    0% {
      color: #ff9900;
    }
    50% {
      color: #afffbc;
    }
    100% {
      color: #ff9900;
    }
  }
`;

export const SuperFunkyFont = styled.div`
  font-family: "SuperFunky";
  font-size: 20px;
  display: flex;
  user-select: none;

  * {
    background-size: 100%;
    background-color: #ff9900 !important;
    color: #ff9900;
    background-image: linear-gradient(45deg, #ff9900, #afffbc);
    -webkit-background-clip: text;
    -moz-background-clip: text;
    -webkit-text-fill-color: transparent;
    -moz-text-fill-color: transparent;
  }
`;

const bounceKeyframes = keyframes`
  0% {
      transform: scale(1, 1) translateY(0);
    }
    2% {
      transform: scale(1.1, 0.9) translateY(0);
    }
    5% {
      transform: scale(0.9, 1.1) translateY(-10px);
    }
    10% {
      transform: scale(1.05, 0.95) translateY(0);
    }
    12% {
      transform: scale(1, 1) translateY(-2px);
    }
    15% {
      transform: scale(1, 1) translateY(0);
    }
    100% {
      transform: scale(1, 1) translateY(0);
    }
`;

const BounceText = styled.span<{ delay: number }>`
  animation: ${bounceKeyframes} 5s infinite ${(p): number => p.delay}s;
  -webkit-animation: ${bounceKeyframes} 5s infinite ${(p): number => p.delay}s;
`;

const DisabledText = styled.span`
  background-color: white;
  background-image: white;
`;

import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  emoji: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Create Custom Feeds",
    emoji: "📰",
    description: (
      <>
        Easily create custom feeds from various social media platforms to curate
        content that matters to you.
      </>
    ),
  },
  {
    title: "Set Approvers Directly on Social",
    emoji: "👍",
    description: (
      <>
        Assign approvers directly on social media to streamline the content
        curation process.
      </>
    ),
  },
  {
    title: "Automated Content Recaps",
    emoji: "🔄",
    description: (
      <>
        Generate automated recaps of curated content to keep your audience
        informed.
      </>
    ),
  },
  {
    title: "Convert Recaps into Content",
    emoji: "🎙️",
    description: (
      <>
        Transform recaps into engaging content formats like podcasts and
        articles.
      </>
    ),
  },
  {
    title: "Launch Journalist Agent Tokens (Soon)",
    emoji: "🚀",
    description: (
      <>
        Coming soon: Launch tokens for journalist agents to incentivize content
        creation.
      </>
    ),
  },
];

function Feature({ title, emoji, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <span className={styles.featureEmoji} role="img" aria-label={title}>
          {emoji}
        </span>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

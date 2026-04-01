import { useEffect, useState } from "react";
import { api } from "../api";
import { Modal } from "../components/Modal";
import { useToast } from "../components/ToastProvider";
import {
  Button,
  EmptyState,
  Loader,
  MetricCard,
  PageHeader,
  Panel,
  Progress,
  StatusPill,
  Tag,
} from "../components/ui";

const EMPTY_CAMPAIGN = {
  name: "",
  subject_template: "",
  body_template: "",
  contact_tags: "",
  ab_variant: "",
  ab_subject: "",
};

export function CampaignsPage() {
  const { pushToast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [tagSummary, setTagSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CAMPAIGN);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState("");

  const loadCampaigns = async () => {
    try {
      const [campaignData, analyticsData, tagData] = await Promise.all([
        api("/api/campaigns/"),
        api("/api/dashboard/campaign-analytics"),
        api("/api/contacts/meta/tags?limit=12"),
      ]);
      setCampaigns(campaignData);
      setAnalytics(analyticsData);
      setTagSummary(tagData);
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const createCampaign = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const selectedTags = form.contact_tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const ab_tests =
        form.ab_variant.trim() && form.ab_subject.trim()
          ? [
              {
                variant: form.ab_variant.trim(),
                subject: form.ab_subject.trim(),
                body_template: form.body_template.trim(),
                performance: 0,
              },
            ]
          : [];

      await api("/api/campaigns/", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          subject_template: form.subject_template.trim(),
          body_template: form.body_template.trim(),
          contact_tags: selectedTags,
          ab_tests,
        }),
      });

      pushToast("Campaign created", "success");
      setForm(EMPTY_CAMPAIGN);
      setModalOpen(false);
      await loadCampaigns();
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const launchCampaign = async (campaign) => {
    if (
      !window.confirm(
        `Launch "${campaign.name}"? This will send real personalized emails.`,
      )
    ) {
      return;
    }
    setBusyId(campaign.id);
    try {
      const data = await api(`/api/campaigns/${campaign.id}/launch`, {
        method: "POST",
      });
      pushToast(`Launched campaign. ${data.emails_sent} emails sent`, "success");
      await loadCampaigns();
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setBusyId("");
    }
  };

  const deleteCampaign = async (campaign) => {
    if (!window.confirm(`Delete "${campaign.name}"?`)) {
      return;
    }
    setBusyId(campaign.id);
    try {
      await api(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
      pushToast("Campaign deleted", "success");
      await loadCampaigns();
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setBusyId("");
    }
  };

  const selectedTags = form.contact_tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const estimatedAudience = selectedTags.length
    ? selectedTags.reduce((sum, tag) => {
        const match = tagSummary.find((item) => item.tag === tag);
        return sum + (match?.count || 0);
      }, 0)
    : campaigns.length;

  if (loading) {
    return <Loader label="Loading campaigns" />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Personalization Engine"
        title="Launch campaigns that still feel one-to-one."
        description="Build sequences with target audiences, AI-personalized body copy, and a clean operating view for reply performance."
        actions={
          <Button icon="plus" onClick={() => setModalOpen(true)}>
            New campaign
          </Button>
        }
        stats={[
          {
            label: "Campaigns",
            value: campaigns.length,
            helper: "Drafts and completed plays",
          },
          {
            label: "Audience tags",
            value: tagSummary.length,
            helper: "Segments available for targeting",
          },
          {
            label: "Reply surface",
            value: analytics.length,
            helper: "Performance tracked by campaign",
          },
        ]}
      />

      <section className="metric-grid reveal reveal-delay-1">
        <MetricCard
          accent="amber"
          helper="Across all campaigns"
          icon="campaigns"
          label="Total campaigns"
          value={campaigns.length}
        />
        <MetricCard
          accent="lime"
          helper="Delivered messages"
          icon="send"
          label="Emails sent"
          value={campaigns
            .reduce((sum, campaign) => sum + (campaign.metrics?.emails_sent || 0), 0)
            .toLocaleString()}
        />
        <MetricCard
          accent="cyan"
          helper="Observed responses"
          icon="mail"
          label="Replies"
          value={campaigns
            .reduce((sum, campaign) => sum + (campaign.metrics?.replies || 0), 0)
            .toLocaleString()}
        />
        <MetricCard
          accent="violet"
          helper="High intent outcomes"
          icon="target"
          label="Conversions"
          value={campaigns
            .reduce((sum, campaign) => sum + (campaign.metrics?.conversions || 0), 0)
            .toLocaleString()}
        />
      </section>

      <section className="dashboard-grid">
        <Panel
          className="span-2"
          subtitle="Leaderboard by delivery and reply rate"
          title="Campaign analytics"
        >
          {analytics.length ? (
            <div className="stack-list">
              {analytics.map((item) => (
                <div className="line-item" key={item._id}>
                  <div className="line-copy">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.emails_sent || 0} emails sent</span>
                    </div>
                    <StatusPill status={item.status} />
                  </div>
                  <div className="line-metrics">
                    <Progress value={Number(item.reply_rate || 0)} />
                    <div className="inline-metrics">
                      <span>{Number(item.reply_rate || 0).toFixed(1)}% reply</span>
                      <span>{item.replies || 0} replies</span>
                      <span>{item.conversions || 0} conversions</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              action={<Button icon="plus" onClick={() => setModalOpen(true)}>Create campaign</Button>}
              description="Analytics will light up after your first campaign launch."
              icon="chart"
              title="No campaign data yet"
            />
          )}
        </Panel>

        <Panel subtitle="Recommended audiences" title="Targeting map">
          <div className="chip-row">
            {tagSummary.length ? (
              tagSummary.map((item) => (
                <Tag
                  key={item.tag}
                  onClick={() =>
                    setForm((current) => {
                      const tags = current.contact_tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean);
                      const exists = tags.includes(item.tag);
                      const nextTags = exists
                        ? tags.filter((tag) => tag !== item.tag)
                        : [...tags, item.tag];
                      return {
                        ...current,
                        contact_tags: nextTags.join(", "),
                      };
                    })
                  }
                  tone="accent"
                >
                  {item.tag} · {item.count}
                </Tag>
              ))
            ) : (
              <p className="muted">No tags exist yet. Add segmentation on the contacts page.</p>
            )}
          </div>
          <div className="insight-card">
            <p className="eyebrow">Draft audience estimate</p>
            <p>
              {selectedTags.length
                ? `${estimatedAudience} tagged contacts may be reached by the current draft audience selection.`
                : "Choose one or more contact tags to narrow the audience for the next campaign."}
            </p>
          </div>
        </Panel>
      </section>

      <Panel subtitle="Launch queue" title="Campaign library">
        {campaigns.length ? (
          <div className="campaign-grid">
            {campaigns.map((campaign) => {
              const sent = campaign.metrics?.emails_sent || 0;
              const replies = campaign.metrics?.replies || 0;
              const conversions = campaign.metrics?.conversions || 0;
              const replyRate = sent ? (replies / sent) * 100 : 0;
              const canLaunch = campaign.status !== "running" && campaign.status !== "completed";

              return (
                <article className="campaign-card" key={campaign.id}>
                  <div className="campaign-card-head">
                    <div>
                      <StatusPill status={campaign.status} />
                      <h3>{campaign.name}</h3>
                    </div>
                    <span className="muted">
                      {(campaign.contact_tags || []).length
                        ? `${campaign.contact_tags.length} audience tags`
                        : "All contacts"}
                    </span>
                  </div>

                  <div className="campaign-card-body">
                    <p className="eyebrow">Subject template</p>
                    <p className="campaign-subject">{campaign.subject_template}</p>
                    <p className="campaign-snippet">{campaign.body_template}</p>
                  </div>

                  <div className="chip-row">
                    {(campaign.contact_tags || []).length ? (
                      campaign.contact_tags.map((tag) => (
                        <span className="static-chip accent-chip" key={tag}>
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="static-chip">Global audience</span>
                    )}
                  </div>

                  <div className="stats-inline-grid">
                    <div className="mini-stat">
                      <span>Sent</span>
                      <strong>{sent}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Replies</span>
                      <strong>{replies}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Conversions</span>
                      <strong>{conversions}</strong>
                    </div>
                  </div>

                  <div className="line-metrics">
                    <Progress value={replyRate} />
                    <div className="inline-metrics">
                      <span>{replyRate.toFixed(1)}% reply rate</span>
                      <span>
                        {campaign.ab_tests?.length
                          ? `${campaign.ab_tests.length} A/B variant`
                          : "Single version"}
                      </span>
                    </div>
                  </div>

                  <div className="card-actions">
                    {canLaunch ? (
                      <Button
                        className={busyId === campaign.id ? "button-busy" : ""}
                        icon="rocket"
                        onClick={() => launchCampaign(campaign)}
                      >
                        Launch
                      </Button>
                    ) : (
                      <Button icon="rocket" variant="ghost">
                        Sent
                      </Button>
                    )}
                    <Button
                      className={busyId === campaign.id ? "button-busy" : ""}
                      icon="trash"
                      onClick={() => deleteCampaign(campaign)}
                      variant="ghost"
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            action={<Button icon="plus" onClick={() => setModalOpen(true)}>Create campaign</Button>}
            description="Draft the first campaign and use contact tags to target the right slice of your audience."
            icon="campaigns"
            title="Campaign library is empty"
          />
        )}
      </Panel>

      <Modal
        description="Use tags to define the audience and let AI personalize the body for each recipient."
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        size="large"
        title="Create a campaign"
      >
        <form className="form-stack" onSubmit={createCampaign}>
          <label className="field">
            <span>Name</span>
            <input
              className="input"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Series A founders intro"
              required
              value={form.name}
            />
          </label>
          <label className="field">
            <span>Subject template</span>
            <input
              className="input"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subject_template: event.target.value,
                }))
              }
              placeholder="Quick thought for {name}"
              required
              value={form.subject_template}
            />
          </label>
          <label className="field">
            <span>Body template</span>
            <textarea
              className="textarea"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  body_template: event.target.value,
                }))
              }
              placeholder="Hi {name}, I noticed {company} is hiring and scaling..."
              required
              value={form.body_template}
            />
          </label>
          <label className="field">
            <span>Audience tags</span>
            <input
              className="input"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contact_tags: event.target.value,
                }))
              }
              placeholder="founder, warm, enterprise"
              value={form.contact_tags}
            />
          </label>
          <div className="chip-row">
            {tagSummary.map((item) => (
              <Tag
                active={selectedTags.includes(item.tag)}
                key={item.tag}
                onClick={() =>
                  setForm((current) => {
                    const tags = current.contact_tags
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean);
                    const exists = tags.includes(item.tag);
                    const nextTags = exists
                      ? tags.filter((tag) => tag !== item.tag)
                      : [...tags, item.tag];
                    return {
                      ...current,
                      contact_tags: nextTags.join(", "),
                    };
                  })
                }
                tone="accent"
              >
                {item.tag}
              </Tag>
            ))}
          </div>
          <div className="form-grid">
            <label className="field">
              <span>A/B variant label</span>
              <input
                className="input"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ab_variant: event.target.value,
                  }))
                }
                placeholder="B"
                value={form.ab_variant}
              />
            </label>
            <label className="field">
              <span>A/B subject</span>
              <input
                className="input"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ab_subject: event.target.value,
                  }))
                }
                placeholder="Alternative subject line"
                value={form.ab_subject}
              />
            </label>
          </div>
          <div className="modal-actions">
            <Button onClick={() => setModalOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button icon="plus" type="submit">
              {submitting ? "Creating..." : "Create campaign"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

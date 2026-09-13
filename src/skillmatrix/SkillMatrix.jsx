import { useEffect, useMemo, useState } from 'react';
import './SkillMatrix.css';
import { TAXONOMY as FALLBACK_TAXONOMY, LEVELS, levelInfo } from './taxonomy';
import { getSkillsMatrix, upsertSkillMatrix, updateSkillMatrixEntry, getSkillsTaxonomy, getStoredUser, resolveLearnerId } from '../api';

// The taxonomy (categories/skill list on the left) now loads from the real
// backend (GET /skills/taxonomy) instead of the local mock in taxonomy.js -
// this is what fixed the "The selected skill id is invalid" error: the
// mock used made-up string ids ("python", "react"...) that don't exist in
// the backend's skills table, so upsertSkillMatrix was rejected.
//
// Confirmed shape (from an actual logged sample - see
// "[SkillMatrix] raw /skills/taxonomy response" in the console): `data` is
// a FLAT array of skill nodes, each shaped like:
//   { id, name, parent: null, parent_skill_id: null, slug, status, ... }
// There's no nested `skills`/`children` array and no `category` string -
// the hierarchy is expressed purely through `parent_skill_id`: a node with
// parent_skill_id === null is a top-level "category" (e.g. "Web
// Development"), and any node whose parent_skill_id equals that category's
// id is one of its skills (e.g. "React").
function normalizeTaxonomy(raw) {
  try {
    const root = raw?.data ?? raw;

    if (Array.isArray(root) && root.length === 0) {
      // Valid, well-formed response - the server just has no skills yet.
      return { categories: [], empty: true };
    }

    if (!Array.isArray(root) || !root.length) return null;

    // Primary path: flat list + parent_skill_id tree (the confirmed shape).
    if ('parent_skill_id' in root[0]) {
      const topLevel = root.filter((s) => s.parent_skill_id == null);
      const categories = topLevel
        .map((cat) => ({
          key: cat.slug || String(cat.id),
          label: cat.name || cat.title || `Category ${cat.id}`,
          skills: root
            .filter((s) => s.parent_skill_id === cat.id)
            .map((s) => ({ id: s.id, name: s.name || s.title || '', description: s.description || '' })),
        }))
        .filter((cat) => cat.skills.length > 0);

      if (categories.length) return { categories, empty: false };

      // Every top-level node had zero children - either it's genuinely a
      // flat, non-hierarchical list (each node IS a skill, no category
      // grouping at all) or parent_skill_id points to ids not present in
      // this page of results. Treat every node as its own skill under one
      // "All Skills" bucket rather than showing nothing.
      const flatSkills = root.map((s) => ({ id: s.id, name: s.name || s.title || '', description: s.description || '' }));
      if (flatSkills.every((s) => s.id !== undefined && s.id !== null)) {
        return { categories: [{ key: 'all-skills', label: 'All Skills', skills: flatSkills }], empty: false };
      }
    }

    // Fallback paths for other shapes, kept in case this varies by
    // environment or changes later.
    let rawCategories = null;

    if (root.length && Array.isArray(root[0]?.skills || root[0]?.children)) {
      rawCategories = root;
    } else if (root.length) {
      const buckets = {};
      root.forEach((s) => {
        const catKey = s.category || s.category_name || s.parent_name || s.parent?.name || 'General';
        if (!buckets[catKey]) buckets[catKey] = { key: catKey, label: catKey, skills: [] };
        buckets[catKey].skills.push(s);
      });
      rawCategories = Object.values(buckets);
    }

    if (!rawCategories || !rawCategories.length) return null;

    const categories = rawCategories
      .map((cat, i) => ({
        key: cat.key || cat.slug || cat.id || cat.name || cat.label || `cat-${i}`,
        label: cat.label || cat.name || cat.title || `Category ${i + 1}`,
        skills: (cat.skills || cat.children || [])
          .map((s) => ({
            id: s.id ?? s.skill_id ?? s.skillId ?? s._id ?? s.slug ?? s.code,
            name: s.name || s.title || s.label || '',
            description: s.description || s.desc || '',
          }))
          .filter((s) => s.id !== undefined && s.id !== null && s.id !== ''),
      }))
      .filter((cat) => cat.skills.length > 0);

    if (!categories.length) {
      // Every skill got filtered out for missing an id, or every category
      // ended up with zero skills - log one raw item's actual keys so it's
      // obvious which field name to add above, instead of having to
      // manually expand the {...} in the console.
      const sample = rawCategories[0]?.skills?.[0] || rawCategories[0]?.children?.[0] || rawCategories[0];
      // eslint-disable-next-line no-console
      console.warn('[SkillMatrix] Taxonomy items had no recognizable id field. Sample item keys:', sample && Object.keys(sample), sample);
    }

    return categories.length ? { categories, empty: false } : null;
  } catch {
    return null;
  }
}


function findSkillInTaxonomy(taxonomy, id) {
  for (const cat of taxonomy) {
    const found = cat.skills.find((s) => String(s.id) === String(id));
    if (found) return { ...found, category: cat.key, categoryLabel: cat.label };
  }
  return null;
}

// The logged-in user object comes straight from the login/register response
// (see saveSession in api.js) and its exact shape isn't guaranteed - see
// resolveLearnerId() in api.js for the field names it tries. If none of
// them match, callers should stop and surface a clear error instead of
// silently sending `learner_id: undefined` (which the backend rejects with
// a 422 "learner id field is required" - the request looks fine in
// devtools but the field is just missing, since JSON.stringify drops
// undefined values).


function totalSkillCountOf(taxonomy) {
  return taxonomy.reduce((sum, c) => sum + c.skills.length, 0);
}

function pickFirstUnowned(taxonomy, skills) {
  for (const cat of taxonomy) {
    for (const s of cat.skills) {
      if (!skills[s.id]) return s.id;
    }
  }
  return taxonomy[0]?.skills[0]?.id;
}

const PALETTE = ['#4f46e5', '#7c3aed', '#059669', '#ea580c', '#e11d48', '#0891b2', '#ca8a04', '#9333ea'];
function confidenceToLabel(score) {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function labelToConfidence(label) {
  if (label === 'High') return 90;
  if (label === 'Medium') return 60;
  return 30;
}

const CAT_COLOR = { Programming: '#4f46e5', Web: '#7c3aed', Data: '#059669', Cloud: '#ea580c', Soft: '#e11d48' };

function barColor(level) {
  if (level >= 4) return '#10b981';
  if (level === 3) return '#3b82f6';
  return '#f59e0b';
}

// Simple brand/progress bar - no more onboarding step breadcrumbs (Account
// → Profile → Assessment → Skill Matrix → Dashboard); matches the plainer
// topbar style used elsewhere (brand on the left, a slim progress
// indicator on the right).
function Topbar({ skillCount, totalSkills, onNavigate }) {
  const pct = totalSkills ? Math.min(100, (skillCount / totalSkills) * 100) : 0;
  return (
    <div className="sm-topbar">
      <div
        className="sm-topbar-brand"
        onClick={() => onNavigate && onNavigate('dashboard')}
        style={{ cursor: onNavigate ? 'pointer' : 'default' }}
      >
        <img className="brand-icon" src="/image/logo.png" alt="SkillSpan logo" />
        <span><span className="brand-white">Skill</span><span className="brand-accent">Span</span></span>
      </div>

      <div className="sm-topbar-right">
        <div className="sm-progress-track">
          <div className="sm-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="sm-count-block">
          <div className="sm-count">{skillCount}</div>
          <div className="sm-count-label">skills</div>
        </div>
      </div>
    </div>
  );
}

export default function SkillMatrix({ onNavigate }) {
  const currentUser = getStoredUser();
  const learnerId = resolveLearnerId(currentUser);
  const [taxonomy, setTaxonomy] = useState(FALLBACK_TAXONOMY);
  const [taxonomySource, setTaxonomySource] = useState('loading'); // loading | live | fallback
  const [taxonomyError, setTaxonomyError] = useState(null);
  const [skills, setSkills] = useState({});
  // Maps skill id -> backend matrix row id, so edits PUT /skills/matrix/{id}
  // instead of re-POSTing (which would try to upsert a duplicate pair).
  const [rowIds, setRowIds] = useState({});
  const [loadingMatrix, setLoadingMatrix] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [tab, setTab] = useState('all'); // all | assessment | self
  const [openCategories, setOpenCategories] = useState(() => new Set(FALLBACK_TAXONOMY.map((c) => c.key)));
  const [panelSkillId, setPanelSkillId] = useState(null);
  const [panelLevel, setPanelLevel] = useState(1);
  const [duplicateSkillId, setDuplicateSkillId] = useState(null);
  const loading = loadingMatrix || taxonomySource === 'loading';

  useEffect(() => {
    let cancelled = false;
    getSkillsTaxonomy()
      .then((raw) => {
        // Leave this log in until the real shape is confirmed - see the
        // note above normalizeTaxonomy().
        console.log('[SkillMatrix] raw /skills/taxonomy response:', raw);
        if (cancelled) return;
        const result = normalizeTaxonomy(raw);
        if (!result) {
          setTaxonomySource('fallback');
          setTaxonomyError(
            "Couldn't recognize the server's skill list format - showing a local fallback list instead. Check the console for the raw response."
          );
        } else if (result.empty) {
          setTaxonomySource('fallback');
          setTaxonomyError(
            'The server has no skills set up yet (GET /skills/taxonomy returned an empty list) - showing a local fallback list. Adding a skill will still fail until the backend team seeds the skills table; this needs a backend fix, not a frontend one.'
          );
        } else {
          setTaxonomy(result.categories);
          setOpenCategories(new Set(result.categories.map((c) => c.key)));
          setTaxonomySource('live');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setTaxonomySource('fallback');
        setTaxonomyError(`Couldn't load skills from the server (${err.message || 'unknown error'}) - showing a local fallback list.`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!learnerId) {
      // Same "can't resolve who you are" situation as saveSkill() below -
      // don't bother calling the API when we already know it'll 422.
      setLoadingMatrix(false);
      setLoadError("We couldn't find your learner id in your session. Try logging out and back in.");
      return undefined;
    }
    setLoadingMatrix(true);
    setLoadError(null);
    getSkillsMatrix(learnerId)
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : data?.data || [];
        const nextSkills = {};
        const nextRowIds = {};
        rows
          .filter((row) => !learnerId || row.learner_id === learnerId)
          .forEach((row) => {
            nextSkills[row.skill_id] = {
              source: row.source_type === 'assessment' ? 'assessment' : 'self',
              level: row.level,
              confidence: confidenceToLabel(row.confidence_score ?? 0),
            };
            nextRowIds[row.skill_id] = row.id;
          });
        setSkills(nextSkills);
        setRowIds(nextRowIds);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Could not load your skill matrix.');
      })
      .finally(() => {
        if (!cancelled) setLoadingMatrix(false);
      });
    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  const skillIds = Object.keys(skills);
  const assessmentCount = skillIds.filter((id) => skills[id].source === 'assessment').length;
  const selfCount = skillIds.filter((id) => skills[id].source === 'self').length;
  const avgProficiency = skillIds.length
    ? (skillIds.reduce((sum, id) => sum + skills[id].level, 0) / skillIds.length).toFixed(1)
    : '0.0';

  const coverage = useMemo(
    () =>
      taxonomy.map((cat) => {
        const have = cat.skills.filter((s) => skills[s.id]).length;
        return { key: cat.key, label: cat.label, pct: cat.skills.length ? Math.round((have / cat.skills.length) * 100) : 0 };
      }),
    [skills, taxonomy]
  );

  const cards = useMemo(() => {
    return skillIds
      .filter((id) => (tab === 'all' ? true : tab === 'assessment' ? skills[id].source === 'assessment' : skills[id].source === 'self'))
      .map((id) => {
        const meta = findSkillInTaxonomy(taxonomy, id);
        return meta ? { id, ...meta, ...skills[id] } : null;
      })
      .filter(Boolean);
  }, [skillIds, skills, tab, taxonomy]);

  const toggleCategory = (key) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const openAddSkill = (skillId) => {
    if (skills[skillId]) {
      setDuplicateSkillId(skillId);
      return;
    }
    setPanelSkillId(skillId);
    setPanelLevel(1);
  };

  const closePanel = () => setPanelSkillId(null);

  const saveSkill = async () => {
    if (!panelSkillId) return;
    if (!learnerId) {
      console.warn('[SkillMatrix] Could not resolve a learner id from the stored user - raw value:', currentUser);
      setSaveError("We couldn't find your learner id in your session. Try logging out and back in; if it keeps happening, check the console for the raw stored user object.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const confidence = 'Low'; // self-assessed entries always start at Low confidence (BR-08)
    try {
      const existingRowId = rowIds[panelSkillId];
      if (existingRowId) {
        await updateSkillMatrixEntry(existingRowId, {
          level: panelLevel,
          confidence_score: labelToConfidence(confidence),
        });
      } else {
        const created = await upsertSkillMatrix({
          learner_id: learnerId,
          skill_id: panelSkillId,
          level: panelLevel,
          confidence_score: labelToConfidence(confidence),
          source_type: 'self',
        });
        if (created?.id) {
          setRowIds((prev) => ({ ...prev, [panelSkillId]: created.id }));
        }
      }
      setSkills((prev) => ({
        ...prev,
        [panelSkillId]: { source: 'self', level: panelLevel, confidence },
      }));
      closePanel();
    } catch (err) {
      setSaveError(err.message || 'Could not save this skill. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const goEditExisting = () => {
    const id = duplicateSkillId;
    setDuplicateSkillId(null);
    if (id) {
      setPanelSkillId(id);
      setPanelLevel(skills[id].level);
    }
  };

  const panelMeta = panelSkillId ? findSkillInTaxonomy(taxonomy, panelSkillId) : null;
  const duplicateMeta = duplicateSkillId ? findSkillInTaxonomy(taxonomy, duplicateSkillId) : null;
  const isEditingExisting = panelSkillId && skills[panelSkillId];

  if (loading) {
    return (
      <div className="sm-shell">
        <Topbar skillCount={0} totalSkills={0} onNavigate={onNavigate} />
        <div className="sm-loading">Loading your skill matrix…</div>
      </div>
    );
  }

  return (
    <div className="sm-shell">
      {loadError && <div className="sm-load-error">{loadError}</div>}
      <Topbar skillCount={skillIds.length} totalSkills={totalSkillCountOf(taxonomy)} onNavigate={onNavigate} />

      {taxonomyError && <div className="sm-load-error">{taxonomyError}</div>}

      <div className={`sm-body${panelSkillId ? ' with-panel' : ''}`}>
        {/* Left: taxonomy */}
        <aside className="sm-taxonomy">
          <div className="sm-taxonomy-label">SKILL TAXONOMY</div>
          <div className="sm-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input placeholder="Search skills..." />
          </div>

          {taxonomy.map((cat) => {
            const isOpen = openCategories.has(cat.key);
            const haveCount = cat.skills.filter((s) => skills[s.id]).length;
            return (
              <div className="sm-category" key={cat.key}>
                <div className="sm-category-head" onClick={() => toggleCategory(cat.key)}>
                  <span className="sm-category-check" />
                  <span className="sm-category-title">
                    {cat.label}
                    <div className="sm-category-count">{cat.skills.length} skills</div>
                  </span>
                  {haveCount > 0 && <span className="sm-category-badge">+{haveCount}</span>}
                  <span className="sm-category-chevron">{isOpen ? '▾' : '▸'}</span>
                </div>
                {isOpen && (
                  <div className="sm-skill-list">
                    {cat.skills.map((s) => {
                      const owned = !!skills[s.id];
                      return (
                        <div className="sm-skill-item" key={s.id} onClick={() => openAddSkill(s.id)}>
                          <span className={`sm-skill-check${owned ? ' checked' : ''}`}>{owned ? '✓' : ''}</span>
                          {s.name}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="sm-coverage">
            <div className="sm-coverage-label">COVERAGE</div>
            {coverage.map((c, i) => (
              <div className="sm-coverage-row" key={c.key}>
                <span className="cname">{c.label.split(' ')[0]}</span>
                <span className="sm-coverage-track">
                  <span className="sm-coverage-fill" style={{ width: `${c.pct}%`, background: CAT_COLOR[c.key] || PALETTE[i % PALETTE.length] }} />
                </span>
                <span className="sm-coverage-pct">{c.pct}%</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Middle: skill matrix */}
        <main className="sm-main">
          <div className="sm-main-head">
            <div>
              <h1>My Skill Matrix</h1>
              <p>{skillIds.length} skills · initialized from US-ASM-01 baseline assessment</p>
            </div>
            <div className="sm-head-actions">
              <div className="sm-tabs">
                <button type="button" className={`sm-tab${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>All Skills</button>
                <button type="button" className={`sm-tab${tab === 'assessment' ? ' active' : ''}`} onClick={() => setTab('assessment')}>Assessment</button>
                <button type="button" className={`sm-tab${tab === 'self' ? ' active' : ''}`} onClick={() => setTab('self')}>Self-Assessed</button>
              </div>
              <button type="button" className="btn-add-skill" onClick={() => openAddSkill(pickFirstUnowned(taxonomy, skills))}>
                + Add Skill
              </button>
            </div>
          </div>

          <div className="sm-summary-row">
            <span className="sm-summary-chip"><b>{assessmentCount}</b>&nbsp;Assessment-derived</span>
            <span className="sm-summary-chip"><b>{selfCount}</b>&nbsp;Self-assessed</span>
            <span className="sm-summary-chip avg"><b>{avgProficiency}/5</b>&nbsp;Avg proficiency</span>
          </div>

          <div className="sm-grid">
            {cards.map((card, index) => {
              const lv = levelInfo(card.level);
              return (
                <div
                  className="sm-card"
                  key={card.id}
                  onClick={() => openAddSkill(card.id)}
                  style={{ cursor: 'pointer', animationDelay: `${Math.min(index, 10) * 45}ms` }}
                >
                  <div className="sm-card-top">
                    <span className="sname">{card.name}</span>
                    <span className={`sm-card-cat cat-${card.category}`}>{card.category}</span>
                  </div>
                  <div className="sm-card-desc">{card.description}</div>
                  <div className="sm-level-row">
                    <span className="sm-dots">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span key={i} className={`sm-dot lvl-${card.level}${i < card.level ? ' on' : ''}`} />
                      ))}
                    </span>
                    <span className={`lvl-${card.level}`}>{lv.name}</span>
                    <span className="sm-level-badge">Lv {card.level}/5</span>
                  </div>
                  <div className="sm-bar-track">
                    <div className="sm-bar-fill" style={{ width: `${(card.level / 5) * 100}%`, background: barColor(card.level) }} />
                  </div>
                  <div className="sm-card-bottom">
                    {card.source === 'assessment' ? (
                      <span className="sm-source-badge src-assessment">⟳ Assessment</span>
                    ) : (
                      <span className="sm-source-badge src-self">🕐 Self-assessed</span>
                    )}
                    <span className={`sm-confidence conf-${card.confidence}`}>
                      <span className="cdot" /> {card.confidence} confidence
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sm-info-banner">
            <span>ℹ️</span>
            <span>
              <b>AC-09 — Assessment Initialization:</b> These skills were automatically initialized from your baseline
              assessment results (US-ASM-01). Assessment-derived skills carry a higher confidence score than
              self-assessed entries (BR-08). You can add new skills from the taxonomy or adjust self-assessed levels.
            </span>
          </div>
        </main>

        {/* Right: add skill panel */}
        {panelSkillId && panelMeta && (
          <aside className="sm-panel">
            <div className="sm-panel-head">
              <span className="sm-panel-label">{isEditingExisting ? 'EDIT SKILL' : 'ADD SKILL'}</span>
              <button type="button" className="sm-panel-close" onClick={closePanel}>✕</button>
            </div>

            <div className="sm-panel-skill">
              <span className="sm-panel-avatar">{panelMeta.name[0]}</span>
              <div>
                <div className="sk-name">{panelMeta.name}</div>
                <div className="sk-cat">{panelMeta.categoryLabel}</div>
              </div>
            </div>

            <textarea rows={2} readOnly value={panelMeta.description} />

            <div className="sm-field-label">
              PROFICIENCY LEVEL
              <span className="sm-level-tag">{panelLevel} / 5 — {levelInfo(panelLevel).name}</span>
            </div>
            <div className="sm-level-grid">
              {LEVELS.map((lv) => (
                <button
                  type="button"
                  key={lv.value}
                  className={`sm-level-btn${panelLevel === lv.value ? ' selected' : ''}`}
                  onClick={() => setPanelLevel(lv.value)}
                >
                  <div className="lnum">{lv.value}</div>
                  <div className="llabel">{lv.label}</div>
                </button>
              ))}
            </div>

            <div className="sm-level-desc">
              <div className="ld-title">{levelInfo(panelLevel).name}</div>
              <div className="ld-sub">{levelInfo(panelLevel).desc}</div>
            </div>

            <div className="sm-scale-dots">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`d${i <= panelLevel ? ' on' : ''}`} />
              ))}
            </div>

            <div className="sm-field-label">SKILL SOURCE (BR-06 · BR-07)</div>
            <div className="sm-source-option disabled">
              <span className="sm-source-radio" />
              <div>
                <div className="so-title">Assessment-derived</div>
                <div className="so-sub">Higher confidence · verified source (from taking an assessment)</div>
              </div>
            </div>
            <div className="sm-source-option selected">
              <span className="sm-source-radio on" />
              <div>
                <div className="so-title">Self-assessed</div>
                <div className="so-sub">Lower confidence · self-reported</div>
              </div>
            </div>

            {saveError && <div className="sm-save-error">{saveError}</div>}
            <button type="button" className="btn-save-skill" onClick={saveSkill} disabled={saving}>
              {saving ? 'Saving…' : 'Save Skill'}
            </button>
            <button type="button" className="btn-cancel-skill" onClick={closePanel} disabled={saving}>Cancel</button>
          </aside>
        )}
      </div>

      {duplicateSkillId && duplicateMeta && (
        <div className="sm-modal-overlay" onClick={() => setDuplicateSkillId(null)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-icon">⚠️</div>
            <h3>Skill already exists</h3>
            <p><b>{duplicateMeta.name}</b> is already in your Skill Matrix. Duplicate active skill records are not permitted (BR-09 / AC-07).</p>
            <div className="sm-modal-note">To change the level, click the existing skill card to edit it.</div>
            <div className="sm-modal-actions">
              <button type="button" className="btn-dismiss" onClick={() => setDuplicateSkillId(null)}>Dismiss</button>
              <button type="button" className="btn-edit" onClick={goEditExisting}>Edit Existing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

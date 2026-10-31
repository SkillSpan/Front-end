import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SkillMatrix.css';
import { TAXONOMY as FALLBACK_TAXONOMY, LEVELS, levelInfo } from './taxonomy';
import { getSkillsMatrix, upsertSkillMatrix, updateSkillMatrixEntry, deleteLearnerSkill, getSkillsTaxonomy, getStoredUser, resolveLearnerId, getProfile, getSpecializations, getCareerRoles, getCareerRoleSkills } from '../../api';
import AppLayout from '../dashboard/AppLayout';
import { useAuth } from '../auth/AuthContext';
import { signOutToLanding } from '../auth/signOut';

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

// The learner picks a specialization (e.g. "Computer Science", "Marketing")
// during profile setup. The skill taxonomy is a general list, so we narrow the
// categories on the left (and the skills inside them) to the ones relevant to
// that specialization. Each rule: if the specialization text matches `spec`,
// categories whose label/key matches `cats` are kept. Soft/general categories
// are always kept. If nothing matches at all we show everything, so a learner
// with an unusual specialization never ends up with an empty list.
const ALWAYS_SHOWN = /soft|general|professional|communication|leadership|interpersonal/i;
const SPECIALIZATION_RULES = [
  {
    spec: /computer|software|information tech|informatics|programming|cyber|network|\bit\b|\bai\b|artificial|web|mobile|app/i,
    cats: /program|language|web|develop|software|data|analytic|cloud|devops|security|mobile|database|machine|\bai\b|engineer|frontend|backend/i,
  },
  {
    spec: /data|statistic|math|analytic/i,
    cats: /data|analytic|machine|\bai\b|statistic|program|language|database/i,
  },
  {
    spec: /business|management|marketing|financ|account|econom|commerce|administration/i,
    cats: /business|market|financ|account|econom|management|analytic|data|project|sales/i,
  },
  {
    spec: /design|graphic|art|ui|ux|media/i,
    cats: /design|ui|ux|graphic|creative|media|web|frontend/i,
  },
  {
    spec: /engineering|mechanical|electrical|civil/i,
    cats: /engineer|cad|design|project|math|program|data/i,
  },
];

function filterTaxonomyBySpecialization(taxonomy, specialization) {
  const spec = (specialization || '').trim();
  if (!spec) return taxonomy;

  const text = (cat) => `${cat.label} ${cat.key}`;
  const words = spec.toLowerCase().split(/[^a-z0-9+#]+/).filter((w) => w.length >= 4);

  const matched = taxonomy.filter((cat) => {
    const t = text(cat);
    if (ALWAYS_SHOWN.test(t)) return false; // handled below
    if (words.some((w) => t.toLowerCase().includes(w))) return true;
    return SPECIALIZATION_RULES.some((r) => r.spec.test(spec) && r.cats.test(t));
  });

  // Nothing relevant found -> don't hide anything.
  if (!matched.length) return taxonomy;

  const always = taxonomy.filter((cat) => ALWAYS_SHOWN.test(text(cat)));
  return taxonomy.filter((cat) => matched.includes(cat) || always.includes(cat));
}

// GET /career-roles/{id}/skills is documented as "one decision snapshot", so
// depending on the backend the skills may come as a bare array, under `data`,
// or nested under a key such as `skills` / `required_skills`. Find the list
// wherever it is and read each row's skill id (and name, as a second way to
// match the taxonomy in case an id is a pivot-row id).
function roleSkillRefs(res) {
  const isRow = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const pickList = (node, depth = 0) => {
    if (Array.isArray(node)) return node;
    if (!isRow(node) || depth > 3) return null;
    for (const key of ['skills', 'required_skills', 'role_skills', 'items', 'data']) {
      const found = pickList(node[key], depth + 1);
      if (found) return found;
    }
    return null;
  };
  const rows = (pickList(res) || []).filter(isRow);
  const ids = [];
  const names = [];
  rows.forEach((row) => {
    const id = row.skill_id ?? row.skill?.id ?? row.skill?.skill_id;
    if (id != null) ids.push(String(id));
    const name = row.skill_name ?? row.skill?.name ?? row.name;
    if (typeof name === 'string' && name.trim()) names.push(name.trim().toLowerCase());
  });
  return { rowCount: rows.length, ids, names };
}

export default function SkillMatrix({ onNavigate, initialTab = 'all' }) {
  const { authUser, logout } = useAuth();
  const navigate = useNavigate();
  const currentUser = authUser || getStoredUser();
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
  const [tab, setTab] = useState(
    initialTab === 'assessment' || initialTab === 'self' ? initialTab : 'all'
  ); // all | assessment | self
  const [openCategories, setOpenCategories] = useState(() => new Set(FALLBACK_TAXONOMY.map((c) => c.key)));
  const [panelSkillId, setPanelSkillId] = useState(null);
  const [panelLevel, setPanelLevel] = useState(1);
  const [duplicateSkillId, setDuplicateSkillId] = useState(null);
  const [specialization, setSpecialization] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  // Skill ids that belong to the learner's specialization, resolved through the
  // backend links: specialization -> career roles -> required skills. null =
  // not resolved (yet / failed), in which case the name-based fallback is used.
  const [profileSpecId, setProfileSpecId] = useState(null);
  const [specSkillIds, setSpecSkillIds] = useState(null);
  const [specSkillNames, setSpecSkillNames] = useState(null);
  // Why the specialization filter could not be applied (shown to the learner).
  const [specFilterNote, setSpecFilterNote] = useState('');
  const [query, setQuery] = useState('');
  const loading = loadingMatrix || taxonomySource === 'loading' || !profileLoaded;

  // The learner's chosen specialization (set during profile setup).
  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data || res || {};
        setSpecialization(data.specialization || '');
        setProfileSpecId(data.specialization_id ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProfileLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve which skills belong to the learner's specialization:
  //   specialization -> GET /career-roles?specialization_id=X
  //                  -> GET /career-roles/{id}/skills for each role
  // The skill taxonomy itself has no specialization info, so this is what makes
  // "show skills by my specialization" work with the real data. Every step that
  // can fail sets `specFilterNote`, so the learner (and we) can see why the
  // list is not narrowed instead of silently getting all skills.
  useEffect(() => {
    if (!profileLoaded) return undefined;
    let cancelled = false;
    const finish = (ids, note) => {
      if (cancelled) return;
      setSpecSkillIds(ids);
      setSpecFilterNote(note);
      if (note) console.warn('[skill-matrix] specialization filter:', note);
    };
    const rowsOf = (res) => {
      const v = res?.data ?? res;
      return Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : [];
    };
    // If the backend ever returns every role instead of only the ones for this
    // specialization, and the roles say which specializations they belong to,
    // keep only the matching ones. Roles without that info are trusted as-is.
    const specIdsOfRole = (role) => {
      const out = [];
      const add = (v) => {
        if (v == null || v === '') return;
        if (typeof v === 'object') add(v.id ?? v.specialization_id);
        else out.push(String(v));
      };
      add(role.specialization_id);
      add(role.specialization);
      [role.specialization_ids, role.specializations].forEach((list) => Array.isArray(list) && list.forEach(add));
      return out;
    };
    (async () => {
      try {
        const label = String(specialization || '').trim();
        let specId = profileSpecId;
        if (specId == null) {
          if (!label) return finish(null, 'No specialization is saved in your profile, so all skills are shown.');
          const wanted = label.toLowerCase();
          const list = rowsOf(await getSpecializations());
          const nameOf = (row) => String(row?.name ?? row?.title ?? '').trim().toLowerCase();
          const match =
            list.find((row) => nameOf(row) === wanted) ||
            list.find((row) => nameOf(row) && (nameOf(row).includes(wanted) || wanted.includes(nameOf(row))));
          specId = match?.id ?? null;
          if (specId == null) return finish(null, `Couldn't match “${label}” to a specialization, so all skills are shown.`);
        }
        let roles = rowsOf(await getCareerRoles({ specializationId: specId, perPage: 50 })).filter((r) => r?.id != null);
        if (roles.some((r) => specIdsOfRole(r).length > 0)) {
          roles = roles.filter((r) => {
            const ids = specIdsOfRole(r);
            return ids.length === 0 || ids.includes(String(specId));
          });
        }
        if (!roles.length) return finish(null, `No career roles are linked to “${label || 'your specialization'}” yet, so all skills are shown.`);
        const settled = await Promise.allSettled(roles.map((r) => getCareerRoleSkills(r.id)));
        const ids = new Set();
        const names = new Set();
        let parsedRows = 0;
        let failed = 0;
        let firstError = '';
        settled.forEach((result, index) => {
          if (result.status !== 'fulfilled') {
            failed += 1;
            firstError = firstError || result.reason?.message || 'request failed';
            return;
          }
          const refs = roleSkillRefs(result.value);
          parsedRows += refs.rowCount;
          refs.ids.forEach((id) => ids.add(id));
          refs.names.forEach((name) => names.add(name));
          if (index === 0 && refs.rowCount === 0) {
            console.warn('[skill-matrix] sample /career-roles/{id}/skills response (no skills found in it):', result.value);
          }
        });
        if (!ids.size && !names.size) {
          const who = `“${label || 'your specialization'}”`;
          if (failed === settled.length) {
            return finish(null, `Couldn't load the skills of the career roles of ${who} (${firstError}), so all skills are shown.`);
          }
          return finish(null, parsedRows
            ? `The skills of the career roles of ${who} could not be read, so all skills are shown.`
            : `The career roles of ${who} have no skills linked yet (${roles.length} role${roles.length === 1 ? '' : 's'} checked), so all skills are shown.`);
        }
        if (!cancelled) setSpecSkillNames(names);
        finish(ids, '');
      } catch (err) {
        finish(null, 'Could not load the skills for your specialization, so all skills are shown.');
        console.warn('[skill-matrix] specialization lookup failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileLoaded, profileSpecId, specialization]);

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
      // Can't scope the matrix to "me" client-side without this (the
      // backend doesn't actually filter by learner_id - see the note in
      // careerRolesApi.js / api.js - so this client-side filter is the
      // only thing standing between "my skills" and everyone's skills).
      setLoadingMatrix(false);
      setLoadError("We couldn't find your learner id in your session. Try logging out and back in.");
      return undefined;
    }
    setLoadingMatrix(true);
    setLoadError(null);
    getSkillsMatrix()
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
    ? (skillIds.reduce((sum, id) => sum + (Number(skills[id].level) || 0), 0) / skillIds.length).toFixed(1)
    : '0.0';

  // Categories/skills shown in the left rail, narrowed to the learner's
  // specialization (full taxonomy is still used to resolve owned skills).
  const visibleTaxonomy = useMemo(() => {
    if (showAllSpecs) return taxonomy;
    // Preferred: only the skills linked to the learner's specialization (plus
    // anything they already have in their matrix, so owned skills never vanish).
    if (specSkillIds) {
      const narrowed = taxonomy
        .map((cat) => ({ ...cat, skills: cat.skills.filter((sk) => specSkillIds.has(String(sk.id)) || (specSkillNames && specSkillNames.has(String(sk.name || '').trim().toLowerCase())) || skills[sk.id]) }))
        .filter((cat) => cat.skills.length > 0);
      if (narrowed.length) return narrowed;
    }
    // Fallback: guess from category names.
    return filterTaxonomyBySpecialization(taxonomy, specialization);
  }, [taxonomy, specialization, showAllSpecs, specSkillIds, specSkillNames, skills]);
  const countSkills = (list) => list.reduce((n, cat) => n + cat.skills.length, 0);
  const isFiltered =
    visibleTaxonomy.length !== taxonomy.length || countSkills(visibleTaxonomy) !== countSkills(taxonomy);

  // Search box: narrows the left list (within the specialization filter) and
  // the skill cards by skill name; a category-name match keeps all its skills.
  const q = query.trim().toLowerCase();
  const searchedTaxonomy = useMemo(() => {
    if (!q) return visibleTaxonomy;
    return visibleTaxonomy
      .map((cat) => {
        const catMatches = String(cat.label || '').toLowerCase().includes(q);
        const matched = catMatches
          ? cat.skills
          : cat.skills.filter((sk) => String(sk.name || '').toLowerCase().includes(q));
        return { ...cat, skills: matched };
      })
      .filter((cat) => cat.skills.length > 0);
  }, [visibleTaxonomy, q]);

  const coverage = useMemo(
    () =>
      visibleTaxonomy.map((cat) => {
        const have = cat.skills.filter((s) => skills[s.id]).length;
        return { key: cat.key, label: cat.label, pct: cat.skills.length ? Math.round((have / cat.skills.length) * 100) : 0 };
      }),
    [skills, visibleTaxonomy]
  );

  const cards = useMemo(() => {
    return skillIds
      .filter((id) => (tab === 'all' ? true : tab === 'assessment' ? skills[id].source === 'assessment' : skills[id].source === 'self'))
      .map((id) => {
        const meta = findSkillInTaxonomy(taxonomy, id);
        return meta ? { id, ...meta, ...skills[id] } : null;
      })
      .filter(Boolean)
      .filter(
        (card) =>
          !q ||
          String(card.name || '').toLowerCase().includes(q) ||
          String(card.categoryLabel || '').toLowerCase().includes(q)
      );
  }, [skillIds, skills, tab, taxonomy, q]);

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
        const createdId = created?.id ?? created?.data?.id;
        if (createdId) {
          setRowIds((prev) => ({ ...prev, [panelSkillId]: createdId }));
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

  const removeSkill = async () => {
    if (!panelSkillId) return;
    // Only skills already in the matrix can be removed. The endpoint takes the
    // skill's id from the skills table (panelSkillId), not the matrix row id,
    // so the row id (which may be missing right after adding) is not needed.
    if (!skills[panelSkillId]) return;
    if (!window.confirm('Remove this skill from your Skill Matrix?')) return;
    setSaving(true);
    setSaveError(null);
    try {
      await deleteLearnerSkill(panelSkillId);
      setSkills((prev) => {
        const next = { ...prev };
        delete next[panelSkillId];
        return next;
      });
      setRowIds((prev) => {
        const next = { ...prev };
        delete next[panelSkillId];
        return next;
      });
      closePanel();
    } catch (err) {
      setSaveError(err.message || 'Could not remove this skill. Please try again.');
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
      <AppLayout
        active="skill-matrix"
        onNavigate={onNavigate}
        user={currentUser}
        onLogout={() => signOutToLanding(navigate, logout)}
        flushContent
        contentClassName="skillmatrix-app-content"
      >
        <div className="sm-shell">
          <div className="sm-loading">Loading your skill matrix…</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      active="skill-matrix"
      onNavigate={onNavigate}
      user={currentUser}
      onLogout={() => signOutToLanding(navigate, logout)}
      flushContent
      contentClassName="skillmatrix-app-content"
    >
    <div className="sm-shell">
      {loadError && <div className="sm-load-error">{loadError}</div>}

      {taxonomyError && <div className="sm-load-error">{taxonomyError}</div>}

      <div className={`sm-body${panelSkillId ? ' with-panel' : ''}`}>
        {/* Left: taxonomy */}
        <aside className="sm-taxonomy">
          <div className="sm-taxonomy-label">SKILL TAXONOMY</div>
          <div className="sm-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search skills..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
            />
          </div>

          {!showAllSpecs && !isFiltered && profileLoaded && (specFilterNote || (specSkillIds && specialization)) && (
            <div style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 10px', margin: '0 0 10px' }}>
              {specFilterNote ||
                `Every skill in the list is linked to the career roles of “${specialization}”, so nothing could be hidden. If that looks wrong, the specialization-to-role links in the backend may need a check.`}
            </div>
          )}

          {(isFiltered || showAllSpecs) && specialization && (
            <div style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px' }}>
              {showAllSpecs ? 'Showing all specializations' : `Filtered for ${specialization}`}{' · '}
              <button
                type="button"
                onClick={() => setShowAllSpecs((v) => !v)}
                style={{ background: 'none', border: 'none', padding: 0, color: '#4f46e5', cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}
              >
                {showAllSpecs ? 'Filter by mine' : 'Show all'}
              </button>
            </div>
          )}

          {q && searchedTaxonomy.length === 0 && (
            <div style={{ padding: '12px 4px', fontSize: 13, opacity: 0.7 }}>
              No skills match “{query.trim()}”.
              {isFiltered && !showAllSpecs && ' Try “Show all” above to search every specialization.'}
            </div>
          )}

          {searchedTaxonomy.map((cat) => {
            // While searching, show every matching category expanded.
            const isOpen = q ? true : openCategories.has(cat.key);
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
              <button type="button" className="btn-add-skill" onClick={() => openAddSkill(pickFirstUnowned(visibleTaxonomy, skills))}>
                + Add Skill
              </button>
            </div>
          </div>

          <div className="sm-summary-row">
            <span className="sm-summary-chip"><b>{assessmentCount}</b>&nbsp;Assessment-derived</span>
            <span className="sm-summary-chip"><b>{selfCount}</b>&nbsp;Self-assessed</span>
            <span className="sm-summary-chip avg"><b>{avgProficiency}/5</b>&nbsp;Avg proficiency</span>
          </div>

          {q && cards.length === 0 && (
            <div style={{ padding: '24px 4px', fontSize: 14, opacity: 0.7 }}>
              No skills match “{query.trim()}”.
            </div>
          )}

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
            {/* Pinned to the bottom of the panel so Save / Cancel / Delete are
                always visible without scrolling the panel. */}
            <div className="sm-panel-actions">
              <button type="button" className="btn-save-skill" onClick={saveSkill} disabled={saving}>
                {saving ? 'Saving…' : 'Save Skill'}
              </button>
              <div className="sm-panel-actions-row">
                <button type="button" className="btn-cancel-skill" onClick={closePanel} disabled={saving}>Cancel</button>
                {isEditingExisting && (
                  <button
                    type="button"
                    className="btn-cancel-skill"
                    onClick={removeSkill}
                    disabled={saving}
                    style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                  >
                    Delete Skill
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {duplicateSkillId && duplicateMeta && (
        <div className="sm-modal-overlay" onClick={() => setDuplicateSkillId(null)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
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
    </AppLayout>
  );
}
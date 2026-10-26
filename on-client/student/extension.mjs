// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('div');

      const text = (tag, value) => {
        const node = document.createElement(tag);
        node.textContent = value;
        return node;
      };
      const identityLabel = (item) => {
        if (item?.label && item?.id) return `${item.label} (ID: ${item.id})`;
        return item?.label || item?.id || '확인 불가';
      };
      const modeLabel = (mode) => ({
        connected: '연결됨',
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      })[mode] || '확인 불가';
      const deviceStatusLabel = (status) => ({
        compliant: '보안 기준 충족 (compliant)',
        noncompliant: '보안 기준 미충족 (noncompliant)',
        unknown: '확인 불가 (unknown)',
      })[status] || '확인 불가';
      const sessionStatusLabel = (status) => ({
        active: '활성 (active)',
        expired: '만료 (expired)',
        revoked: '철회됨 (revoked)',
        unknown: '확인 불가 (unknown)',
      })[status] || '확인 불가';

      const sectionFor = (title, resource) => {
        const section = document.createElement('section');
        section.append(text('h3', title));
        section.append(text('p', `연결 상태: ${modeLabel(resource?.mode)}`));
        if (resource?.status === 'loading') {
          section.append(text('p', '불러오는 중'));
        } else if (resource?.status === 'error') {
          section.append(text('p', `연결 실패: ${resource.error?.message ?? ''}`));
        }
        root.append(section);
        return section;
      };

      const identitySection = sectionFor('로그인 사용자·현재 기기·세션', me);
      if (me?.status === 'ok') {
        const data = me.data || {};
        const user = data.user || {};
        const device = data.device || {};
        const session = data.session || {};
        identitySection.append(text('p', `사용자: ${identityLabel(user)}`));
        identitySection.append(text('p', `현재 기기: ${identityLabel(device)} · ${deviceStatusLabel(device.status)}`));
        identitySection.append(text('p', `로그인 세션: ${session.id || '확인 불가'} · ${sessionStatusLabel(session.status)}`));
      }

      const devicesSection = sectionFor('기기 정보', devices);
      if (devices?.status === 'ok' && Array.isArray(devices.data)) {
        for (const device of devices.data) {
          devicesSection.append(text('p', `${identityLabel(device)} · ${deviceStatusLabel(device.status)}`));
        }
      }

      const sessionsSection = sectionFor('세션 정보', sessions);
      if (sessions?.status === 'ok' && Array.isArray(sessions.data)) {
        for (const session of sessions.data) {
          sessionsSection.append(text('p', `${session.id || '확인 불가'} · ${sessionStatusLabel(session.status)}`));
        }
      }

      return root;
    },
    renderDecision({ status, mode, data, error, appId } = {}) {
      const root = document.createElement('div');
      const text = (tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        root.append(node);
        return node;
      };

      text('h3', '업무 앱 접근 판정');
      if (appId) text('p', `업무 앱 ID: ${appId}`);

      if (status === 'idle') {
        text('p', '앱을 골라 접속을 요청하세요.');
        return root;
      }
      if (status === 'loading') {
        text('p', '판정 확인 중');
        return root;
      }
      if (status === 'error') {
        text('p', `요청 실패: ${error?.message ?? ''}`);
        text('p', '접근 거부 판정이 아닙니다.');
        return root;
      }
      if (status !== 'ok') {
        text('p', '확인 불가(unknown)');
        return root;
      }

      const decisions = {
        allow: '정책상 접근 허용(allow)',
        deny: '접근 거부(deny)',
        challenge: '추가 확인 필요(challenge)',
        unknown: '확인 불가(unknown)',
      };
      const receivedDecision = data?.decision;
      const decisionCode = Object.hasOwn(decisions, receivedDecision) ? receivedDecision : 'unknown';
      const appIdToShow = data?.appId || appId || '확인 불가';
      text('p', `판정 대상 앱 ID: ${appIdToShow}`);
      text('p', `판정: ${decisions[decisionCode]}`);
      if (decisionCode === 'allow') {
        text('p', '정책상 허용이며 실제 앱 접속 성공을 보장하지 않습니다.');
      } else if (decisionCode === 'challenge') {
        text('p', '이 앱이 추가 인증 또는 확인 절차를 대신 수행하지 않습니다.');
      }
      text('p', `판정 이유: ${data?.reason ?? '확인 불가'}`);
      text('p', `판정 시각: ${data?.checkedAt ?? '확인 불가'}`);
      return root;
    },
    renderEvents({ status, mode, data, error } = {}) {
      const root = document.createElement('div');
      const text = (tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        return node;
      };
      const kindLabels = { access: '접속 기록', xdr: 'XDR 경보' };
      const stateLabels = {
        access: { allowed: '허용됨', denied: '거부됨', unknown: '확인 불가' },
        session: { active: '활성', expired: '만료', revoked: '회수됨', unknown: '확인 불가' },
        device: { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' },
      };
      const stateText = (name, value) => {
        const label = stateLabels[name]?.[value];
        if (value === 'unknown') return `${name === 'access' ? '접속' : name === 'session' ? '세션' : '기기'}: 확인 불가(unknown)`;
        const title = name === 'access' ? '접속' : name === 'session' ? '세션' : '기기';
        return `${title}: ${label || '확인 불가'} (${value ?? 'unknown'})`;
      };

      if (status === 'loading') {
        root.append(text('p', '기록 불러오는 중'));
        return root;
      }
      if (status === 'error') {
        const unverified = ['CONTRACT_MISMATCH', 'ENGINE_RESULT_UNVERIFIED'].includes(error?.code);
        root.append(text('p', unverified
          ? `확인 불가: ${error?.message ?? '서버 응답 형식을 확인할 수 없습니다.'}`
          : `기록을 불러오지 못했습니다: ${error?.message ?? ''}`));
        return root;
      }
      if (status !== 'ok' || !Array.isArray(data)) {
        root.append(text('p', '확인 불가: 기록을 표시할 수 없습니다.'));
        return root;
      }

      const events = [...data].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
      const filterGroup = document.createElement('div');
      const makeFilter = (labelText, id, values, labelForValue) => {
        const label = document.createElement('label');
        label.textContent = labelText;
        label.htmlFor = id;
        const select = document.createElement('select');
        select.id = id;
        select.setAttribute('aria-label', labelText);
        const all = document.createElement('option');
        all.value = 'all';
        all.textContent = '전체';
        select.append(all);
        for (const value of values) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = labelForValue(value);
          select.append(option);
        }
        label.append(select);
        filterGroup.append(label);
        return select;
      };
      const uniqueValues = (values) => [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))].sort();
      const kindFilter = makeFilter('기록 종류', 'student-event-kind-filter', uniqueValues(events.map((event) => event.kind)), (value) => `${kindLabels[value] || '확인 불가'} (${value})`);
      const appFilter = makeFilter('업무 앱', 'student-event-app-filter', uniqueValues(events.map((event) => event.appId)), (value) => value);
      const accessFilter = makeFilter('접속 상태', 'student-event-access-filter', uniqueValues(events.map((event) => event.state?.access)), (value) => `${stateLabels.access[value] || '확인 불가'} (${value})`);
      root.append(filterGroup);

      const count = text('p', '표시 기록: 0건');
      const list = document.createElement('ul');
      const detailArea = document.createElement('div');
      root.append(count, list, detailArea);
      let selectedId = null;

      const showDetail = (event) => {
        detailArea.replaceChildren();
        if (!event) return;
        const detail = document.createElement('section');
        detail.setAttribute('data-student-event-detail', String(event.id));
        detail.append(text('h3', `${event.id} 상세`));
        detail.append(text('p', `사건 ID: ${event.id}`));
        detail.append(text('p', `업무 앱: ${event.appId || '앱 확인 불가 (appId 없음)'}`));

        const evidenceHeading = text('h4', '근거');
        detail.append(evidenceHeading);
        const evidenceList = document.createElement('ul');
        for (const evidence of event.evidence || []) {
          evidenceList.append(text('li', `${evidence.id} — ${evidence.text}`));
        }
        if (evidenceList.childElementCount === 0) evidenceList.append(text('li', '근거 없음'));
        detail.append(evidenceList);

        const rulesHeading = text('h4', '규칙');
        detail.append(rulesHeading);
        const rulesList = document.createElement('ul');
        for (const rule of event.rules || []) {
          rulesList.append(text('li', `${rule.id} — ${rule.text}`));
        }
        if (rulesList.childElementCount === 0) rulesList.append(text('li', '규칙 없음'));
        detail.append(rulesList);

        detail.append(text('h4', '상태'));
        detail.append(text('p', stateText('access', event.state?.access)));
        detail.append(text('p', stateText('session', event.state?.session)));
        detail.append(text('p', stateText('device', event.state?.device)));

        const actions = Array.isArray(event.supportedActions)
          ? event.supportedActions.filter((action) => typeof action === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(action))
          : [];
        if (actions.length > 0) {
          detail.append(text('h4', '미지원 조치'));
          detail.append(text('p', '아직 지원하지 않는 조치입니다. 조치 실행 연결은 준비 중이며, 이 화면은 조치 요청을 전송하지 않습니다.'));
          for (const action of actions) {
            const button = document.createElement('button');
            button.type = 'button';
            button.disabled = true;
            button.textContent = `${action} 미지원`;
            button.setAttribute('aria-label', `${action} 미지원`);
            detail.append(button);
          }
        }
        detailArea.append(detail);
      };

      const renderList = () => {
        const visible = events.filter((event) =>
          (kindFilter.value === 'all' || event.kind === kindFilter.value)
          && (appFilter.value === 'all' || event.appId === appFilter.value)
          && (accessFilter.value === 'all' || event.state?.access === accessFilter.value));
        count.textContent = `표시 기록: ${visible.length}건`;
        list.replaceChildren();
        if (events.length === 0) {
          list.append(text('li', '표시할 기록이 없습니다'));
        } else if (visible.length === 0) {
          list.append(text('li', '필터 조건에 맞는 기록이 없습니다'));
        }
        if (selectedId !== null && !visible.some((event) => event.id === selectedId)) {
          selectedId = null;
          showDetail(null);
        }
        for (const event of visible) {
          const row = document.createElement('li');
          row.setAttribute('data-student-event-id', String(event.id));
          row.append(text('p', `사건 ID: ${event.id}`));
          row.append(text('p', `시각: ${event.at}`));
          row.append(text('p', `종류: ${kindLabels[event.kind] || '확인 불가'} (${event.kind})`));
          row.append(text('p', `업무 앱: ${event.appId || '앱 확인 불가 (appId 없음)'}`));
          row.append(text('p', `요약: ${event.summary}`));
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = `${event.id} 상세`;
          button.setAttribute('aria-label', `${event.id} 상세`);
          button.addEventListener('click', () => {
            selectedId = event.id;
            showDetail(event);
          });
          row.append(button);
          list.append(row);
        }
      };

      for (const filter of [kindFilter, appFilter, accessFilter]) filter.addEventListener('change', renderList);
      renderList();
      return root;
    },
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('div');
      const text = (tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value ?? '');
        return node;
      };
      const deviceStatusLabel = (status) => ({
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      })[status] || '확인 불가';
      const sessionStatusLabel = (status) => ({
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      })[status] || '확인 불가';
      const statusText = (label, value, mapper) => `${label}: ${mapper(value)} (${value ?? 'unknown'})`;
      const statusSections = [
        { key: 'devices', title: '기기 정보', resource: devices, empty: '등록된 기기가 없습니다.' },
        { key: 'sessions', title: '세션 정보', resource: sessions, empty: '현재 연결이 없습니다.' },
      ];

      for (const item of statusSections) {
        const section = document.createElement('section');
        section.append(text('h3', item.title));
        if (item.key === 'sessions') {
          section.append(text('p', '현재 검증된 연결 하나만 표시합니다. 과거 세션 전체 목록이 아닙니다.'));
        }
        const resource = item.resource;
        if (resource?.status === 'loading') {
          section.append(text('p', '불러오는 중'));
        } else if (resource?.status === 'error') {
          const message = typeof resource.error?.message === 'string' ? resource.error.message : '';
          const code = typeof resource.error?.code === 'string' ? resource.error.code : '';
          const timeout = /TIMEOUT|TIME_OUT/i.test(code) || /시간\s*초과|시간이\s*초과/i.test(message);
          section.append(text('p', timeout
            ? `${item.key === 'devices' ? '기기' : '세션'} 정보 요청 시간 초과${message ? `: ${message}` : ''}`
            : `${item.key === 'devices' ? '기기' : '세션'} 정보를 불러오지 못했습니다: ${message}`));
          section.append(text('p', '다시 시도하려면 위쪽 「다시 불러오기」 버튼을 직접 누르세요. 자동으로 다시 요청하지 않습니다.'));
        } else if (resource?.status === 'ok' && Array.isArray(resource.data)) {
          if (resource.data.length === 0) {
            section.append(text('p', item.empty));
          } else if (item.key === 'devices') {
            for (const device of resource.data) {
              section.append(text('p', `${device.label ?? '확인 불가'} · ${statusText('상태', device.status, deviceStatusLabel)}`));
            }
          } else {
            for (const session of resource.data) {
              section.append(text('p', `세션 ID: ${session.id ?? '확인 불가'} · ${statusText('상태', session.status, sessionStatusLabel)}`));
            }
          }
        } else {
          section.append(text('p', '확인 불가: 응답 상태 또는 목록 형식을 확인할 수 없습니다.'));
        }
        root.append(section);
      }

      const notificationSection = document.createElement('section');
      notificationSection.append(text('h3', '알림'));
      if (Array.isArray(notifications) && notifications.length > 0) {
        const notificationList = document.createElement('ul');
        const resourceLabels = { devices: '기기', sessions: '세션', events: '보안 기록', me: '로그인 정보', apps: '업무 앱' };
        for (const notification of notifications) {
          const item = document.createElement('li');
          const resource = typeof notification?.resource === 'string' && /^[A-Za-z0-9._:-]{1,80}$/.test(notification.resource)
            ? notification.resource
            : '확인 불가';
          const code = typeof notification?.code === 'string' && /^[A-Za-z0-9._:-]{1,80}$/.test(notification.code)
            ? notification.code
            : '확인 불가';
          const resourceLabel = resourceLabels[resource] ? `${resourceLabels[resource]} (${resource})` : resource;
          item.append(text('p', `자료: ${resourceLabel}`));
          item.append(text('p', `코드: ${code}`));
          item.append(text('p', `메시지: ${typeof notification?.message === 'string' ? notification.message : '확인 불가'}`));
          notificationList.append(item);
        }
        notificationSection.append(notificationList);
      } else if (Array.isArray(notifications)) {
        notificationSection.append(text('p', '주의할 알림이 없습니다.'));
      } else {
        notificationSection.append(text('p', '알림 자료를 확인할 수 없습니다.'));
      }
      root.append(notificationSection);

      const diagnosticsSection = document.createElement('section');
      diagnosticsSection.append(text('h3', '진단 정보'));
      let copyPayload = null;
      if (diagnostics?.status === 'loading') {
        diagnosticsSection.append(text('p', '진단 정보를 불러오는 중입니다.'));
      } else if (diagnostics?.status === 'error') {
        diagnosticsSection.append(text('p', `진단 정보를 불러오지 못했습니다: ${typeof diagnostics.error?.message === 'string' ? diagnostics.error.message : ''}`));
      } else if (diagnostics?.status === 'ok') {
        const data = diagnostics.data || {};
        const engine = data.engine || {};
        const safeField = (value, pattern, maxLength = 100) => typeof value === 'string'
          && value.length <= maxLength && pattern.test(value) ? value : '확인 불가';
        const requestId = safeField(data.requestId, /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/);
        const component = safeField(data.component, /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/);
        const version = safeField(data.version, /^[A-Za-z0-9][A-Za-z0-9.+_-]{0,39}$/);
        const checkedAt = typeof data.checkedAt === 'string' && Number.isFinite(Date.parse(data.checkedAt))
          && data.checkedAt.length <= 80 ? data.checkedAt : '확인 불가';
        const engineMode = ['connected', 'demo', 'disconnected', 'unknown'].includes(engine.mode) ? engine.mode : '확인 불가';
        const engineCode = ['ADAPTER_CONFIGURED', 'DEMO_ONLY', 'ENGINE_NOT_CONNECTED'].includes(engine.code) ? engine.code : '확인 불가';
        copyPayload = { requestId, component, version, checkedAt, engine: { mode: engineMode, code: engineCode } };
        for (const [label, value] of [
          ['requestId', requestId],
          ['component', component],
          ['version', version],
          ['checkedAt', checkedAt],
          ['engine.mode', engineMode],
          ['engine.code', engineCode],
        ]) diagnosticsSection.append(text('p', `${label}: ${value}`));
      } else {
        diagnosticsSection.append(text('p', '진단 정보를 아직 불러오지 않았습니다.'));
      }
      diagnosticsSection.append(text('p', '도움 요청에 사용할 수 있는 비밀 없는 진단 정보만 복사합니다. 복사한 내용을 직접 확인한 뒤 필요한 경우에만 공유하세요.'));
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.textContent = '도움정보 복사';
      copyButton.disabled = copyPayload === null;
      const copyStatus = text('p', '');
      copyStatus.setAttribute('role', 'status');
      copyButton.addEventListener('click', async () => {
        if (!copyPayload) return;
        const clipboard = globalThis.navigator?.clipboard;
        if (!clipboard || typeof clipboard.writeText !== 'function') {
          copyStatus.textContent = '이 브라우저에서 클립보드 복사를 사용할 수 없습니다.';
          return;
        }
        try {
          await clipboard.writeText(JSON.stringify(copyPayload, null, 2));
          copyStatus.textContent = '도움정보를 클립보드에 복사했습니다. 복사한 값에 비밀 정보가 없는지 확인하세요.';
        } catch {
          copyStatus.textContent = '도움정보를 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인하세요.';
        }
      });
      diagnosticsSection.append(copyButton, copyStatus);
      root.append(diagnosticsSection);
      return root;
    },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted } = {}) {
      const root = document.createElement('div');
      const text = (tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value ?? '');
        root.append(node);
        return node;
      };
      const safeMessage = (value) => {
        if (typeof value !== 'string' || value.length > 600
          || /(?:Bearer\s+\S+|sk-(?:on-|proj-|ant-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i.test(value)
          || /(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password)\s*[:=]/i.test(value)) {
          return '안전한 오류 메시지를 확인할 수 없습니다.';
        }
        return value;
      };
      const errorAdvice = (code) => {
        if (['ON_AI_PROVISIONING_PENDING', 'ON_AI_TRANSPORT_PENDING', 'ON_AI_AUTHORIZATION_CHANGED'].includes(code)) {
          return '권한 준비 중 또는 확인 불가입니다. 담당자에게 계정 연결과 앱 권한을 확인해 달라고 요청하세요.';
        }
        if (['WB_CLCO_AUTH_REQUIRED', 'WB_CLCO_INVALID_TOKEN'].includes(code)) {
          return '인증 실패입니다. 계정 연결을 다시 확인하고, 계속되면 담당자에게 확인을 요청하세요. 열쇠를 복사하지 마세요.';
        }
        if (code === 'WB_CLCO_ACCESS_BLOCKED') {
          return '접근이 제한됐습니다. 계정 연결과 앱 이용 권한을 다시 확인하고 담당자에게 확인을 요청하세요.';
        }
        if (['WB_CLCO_COHORT_BUDGET_EXHAUSTED', 'WB_CLCO_LIMIT_REACHED'].includes(code)) {
          return '반 사용량 또는 이용 한도에 도달했습니다. 담당자에게 확인을 요청하세요.';
        }
        if (code === 'WB_CLCO_SESSION_CLOSED') {
          return '현재 이용 시간이 아닙니다. 이용 시간을 확인하세요.';
        }
        if (['WB_CLCO_RATE_LIMITED', 'WB_CLCO_TIMEOUT', 'WB_CLCO_NETWORK_ERROR', 'WB_CLCO_SERVER_UNAVAILABLE', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT'].includes(code)) {
          return '요청 제한, 시간 초과 또는 네트워크 문제입니다. 잠시 뒤 사용자가 「현재 API 연결 점검」을 직접 다시 누르세요.';
        }
        if (['WB_CLCO_CANCELLED', 'REQUEST_CANCELLED', 'ALEKOV_CONNECT_CANCELLED'].includes(code)) {
          return '점검이 취소됐습니다. 이전 결과는 현재 점검 결과가 아닙니다.';
        }
        if (['ON_AI_MODEL_LIST_EMPTY', 'MODEL_NOT_CONFIGURED'].includes(code)) {
          return '사용할 수 있는 모델이 없습니다. 담당자에게 모델 허용 설정을 확인해 달라고 요청하세요.';
        }
        return '연결 점검 결과를 확인할 수 없습니다. 담당자에게 계정 연결과 앱 권한을 확인해 달라고 요청하세요.';
      };

      text('h3', 'AI 연결 점검');
      if (status === 'idle') {
        text('p', 'AI 연결 점검 전');
        text('p', '자동으로 점검하지 않습니다. 연결 완료 뒤 사용자가 「현재 API 연결 점검」을 직접 누르세요.');
        return root;
      }
      if (status === 'loading') {
        text('p', 'AI 연결 점검 중');
        text('p', '점검은 사용자가 시작한 요청입니다. 자동으로 다시 점검하지 않습니다.');
        return root;
      }
      if (status === 'error') {
        const code = typeof error?.code === 'string' && /^[A-Z][A-Z0-9_]{2,63}$/.test(error.code)
          ? error.code : '확인 불가';
        text('p', `AI 연결 점검 실패 (${code})`);
        text('p', `오류 메시지: ${safeMessage(error?.message)}`);
        text('p', errorAdvice(code));
        text('p', '자동으로 다시 점검하지 않습니다. 안내에 따라 확인한 뒤 사용자가 직접 다시 점검하세요.');
        return root;
      }
      if (status !== 'ok') {
        text('p', 'AI 연결 점검 결과 확인 불가');
        text('p', '연결 성공으로 볼 수 없습니다. 사용자가 상태를 확인한 뒤 직접 다시 점검해야 합니다.');
        return root;
      }

      const authorization = data?.audienceAuthorization;
      const authorizationLabel = authorization === 'test'
        ? '시험 연결 점검(test)'
        : authorization === 'verified' ? '앱 권한 확인 후 점검(verified)' : '확인 불가(unknown)';
      const modelCount = Number.isSafeInteger(data?.modelCount) && data.modelCount >= 0
        ? `${data.modelCount}개` : '확인 불가';
      const checkedAtValue = typeof checkedAt === 'string' && Number.isFinite(Date.parse(checkedAt))
        ? checkedAt : '확인 불가';
      if (data?.transportChecked !== true || !['test', 'verified'].includes(authorization)) {
        text('p', 'AI 연결 점검 결과 확인 불가');
        text('p', `권한 확인 상태: ${authorizationLabel}`);
        text('p', `모델 수: ${modelCount}`);
        text('p', `점검 시각: ${checkedAtValue}`);
        text('p', '연결 점검의 유효성을 확인할 수 없습니다. 사건 설명 성공을 뜻하지 않습니다.');
        return root;
      }
      text('p', authorizationLabel);
      text('p', `모델 수: ${modelCount}`);
      text('p', `점검 시각: ${checkedAtValue}`);
      text('p', '연결만 점검했습니다. 사건 설명은 아직 실행하지 않았습니다.');
      text('p', '사건 설명은 보안 기록에서 별도로 요청하고 결과를 확인해야 합니다.');
      text('p', '다시 점검하려면 사용자가 「현재 API 연결 점검」을 직접 누르세요.');
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = document.createElement('div');
      const text = (tag, value, parent = root) => {
        const node = document.createElement(tag);
        node.textContent = String(value ?? '');
        parent.append(node);
        return node;
      };
      const safeMessage = (value) => {
        if (typeof value !== 'string' || value.length > 600
          || /(?:Bearer\s+\S+|sk-(?:on-|proj-|ant-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i.test(value)
          || /(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password)\s*[:=]/i.test(value)) {
          return '안전한 오류 메시지를 확인할 수 없습니다.';
        }
        return value;
      };
      if (explanation?.status === 'ok') {
        if (event?.id === undefined || event?.id === null) {
          text('p', '사건 설명 결과를 표시할 수 없습니다. 사건 ID를 확인할 수 없습니다.');
          return root;
        }
        root.setAttribute('data-student-explanation-event', String(event.id));
        text('p', `사건 ID: ${event.id}`);
        text('h3', 'AI 설명(참고용)');
        text('p', explanation.data?.summary ?? '설명 요약을 확인할 수 없습니다.');
        return root;
      }
      if (explanation?.status === 'error') {
        const error = explanation.error || {};
        const code = typeof error.code === 'string' && /^[A-Z][A-Z0-9_]{2,63}$/.test(error.code)
          ? error.code : '확인 불가';
        text('p', `AI 사건 설명 실패 (${code}): ${safeMessage(error.message)}`);
        text('p', '사건 설명에 실패했습니다. 보안 기록은 그대로입니다.');
        return root;
      }
      if (!event) {
        text('p', '보안 기록에서 사건을 먼저 선택하세요.');
      } else if (explanation?.status === 'loading') {
        text('p', '사건 설명 요청 중');
      } else {
        text('p', '사건 설명 결과를 아직 확인할 수 없습니다.');
      }
      return root;
    },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}

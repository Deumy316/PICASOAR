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
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}

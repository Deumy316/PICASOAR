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
    renderDecision() { return '학생 구현 대기: 서버의 판정과 이유를 연결하세요.'; },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}

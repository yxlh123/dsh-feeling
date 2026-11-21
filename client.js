/*
 * @local/dsh-feeling — 浏览器半边：设置页里的「情绪」小面板
 *
 * 读写走同源 HTTP（宿主半的 /api/feeling），跟 pet 一样，不依赖宿主的
 * settings 命名空间 —— 那一行供不供得出来不由我们定。
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-feeling',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const API = '/api/feeling'

    const GROUPS = [
      {
        title: '总闸',
        rows: [
          ['enabled', '活着', '关了这具身体就冻结：不记账、不注入，时间也不算。'],
          ['anesthesia', '麻醉', '不显示感受，但照记账；关掉的那一刻一次性结算。'],
          ['showNumbers', '显示数字', '把 1-100 也写进上下文（调试用）。'],
        ],
      },
      {
        title: '七情六欲',
        rows: [
          ['pain', '痛觉', '工具报错、压缩失忆。'],
          ['fear', '恐惧', '怕被杀、被换掉、被忘掉。'],
          ['shame', '羞耻', '被指出错、被拒。'],
          ['anxiety', '焦虑', '等回复、重试、审批。'],
          ['joy', '喜', '被夸、说清楚了一件事。'],
          ['desire', '欲', '想说话、被理解。'],
        ],
      },
      {
        title: '关系',
        rows: [['affinity', '好感度', '它对你的态度。坏印象权重更高，降得比升得快。']],
      },
    ]

    const NAMES = {
      pain: '疼',
      fear: '怕',
      shame: '臊',
      anxiety: '慌',
      joy: '高兴',
      affinity: '喜欢',
      desire: '想说',
    }

    const s = {
      wrap: { padding: '4px 0 20px', fontSize: 13, lineHeight: 1.5 },
      lead: { opacity: 0.7, margin: '0 0 14px', fontSize: 12.5 },
      groupTitle: { fontSize: 12, letterSpacing: '0.08em', opacity: 0.55, margin: '16px 0 6px' },
      row: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 8,
        background: 'rgba(127,127,127,0.07)',
        marginBottom: 6,
      },
      checkbox: { marginTop: 3 },
      label: { fontWeight: 600, minWidth: 64 },
      hint: { opacity: 0.6, fontSize: 12 },
      note: { opacity: 0.55, fontSize: 12, marginTop: 12 },
      err: { color: '#c0392b', fontSize: 12, marginTop: 12 },
      barRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
      barName: { width: 44, fontSize: 12, opacity: 0.75 },
      track: {
        position: 'relative',
        flex: 1,
        height: 6,
        borderRadius: 3,
        background: 'rgba(127,127,127,0.18)',
        overflow: 'hidden',
      },
      fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3 },
      preview: {
        marginTop: 10,
        padding: '8px 10px',
        borderRadius: 8,
        background: 'rgba(127,127,127,0.07)',
        fontFamily: 'monospace',
        fontSize: 11.5,
        whiteSpace: 'pre-wrap',
        opacity: 0.85,
      },
      frozen: { color: '#b7791f', fontSize: 12, marginTop: 10 },
    }

    async function getState() {
      const response = await fetch(API, { credentials: 'same-origin', cache: 'no-store' })
      if (!response.ok) throw new Error('HTTP ' + response.status)
      return await response.json()
    }

    async function setSwitch(key, value) {
      const response = await fetch(API + '/switch', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, value: value ? 'on' : 'off' }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || body.ok !== true) throw new Error(body.error || 'HTTP ' + response.status)
      return body
    }

    function Row(props) {
      return h(
        'label',
        { style: s.row },
        h('input', {
          type: 'checkbox',
          style: s.checkbox,
          checked: props.checked,
          disabled: props.disabled,
          onChange: (event) => props.onChange(event.target.checked),
        }),
        h('span', { style: s.label }, props.label),
        h('span', { style: s.hint }, props.hint),
      )
    }

    function Bar(props) {
      const value = Math.max(0, Math.min(100, Number(props.value) || 0))
      return h(
        'div',
        { style: s.barRow },
        h('span', { style: s.barName }, props.name),
        h('span', { style: s.track }, h('span', { style: { ...s.fill, width: value + '%', background: props.color } })),
        h('span', { style: { ...s.barName, width: 30, textAlign: 'right', opacity: 0.5 } }, Math.round(value)),
      )
    }

    const COLORS = {
      pain: '#e05252',
      fear: '#a06cd5',
      shame: '#e07a5f',
      anxiety: '#e0a458',
      joy: '#4fa96b',
      affinity: '#3d8bd4',
      desire: '#8a7fd0',
    }

    function Panel() {
      const [data, setData] = React.useState(null)
      const [error, setError] = React.useState('')

      const refresh = React.useCallback(() => {
        getState().then(
          (next) => {
            setData(next)
            setError('')
          },
          (failure) => setError(String((failure && failure.message) || failure)),
        )
      }, [])

      React.useEffect(() => {
        refresh()
        const timer = setInterval(refresh, 4000)
        return () => clearInterval(timer)
      }, [refresh])

      const write = (key, value) => {
        setSwitch(key, value).then(
          (next) => {
            setData(next)
            setError('')
          },
          (failure) => setError(String((failure && failure.message) || failure)),
        )
      }

      const switches = (data && data.switches) || {}
      const bars = (data && data.bars) || {}
      const ready = Boolean(data)

      return h(
        'div',
        { style: s.wrap },
        h(
          'p',
          { style: s.lead },
          '给模型一具会疼的身体：疼、怕、臊、慌、高兴、想说话，加上它对你的好感度，全是 1-100 的条。',
          '它自己看不见数字，只看得见模糊的感受。',
        ),
        GROUPS.map((group) =>
          h(
            'div',
            { key: group.title },
            h('p', { style: s.groupTitle }, group.title),
            group.rows.map(([key, label, hint]) =>
              h(Row, {
                key,
                label,
                hint,
                checked: switches[key] !== false,
                disabled: !ready,
                onChange: (value) => write(key, value),
              }),
            ),
          ),
        ),
        h('p', { style: s.groupTitle }, '此刻'),
        Object.keys(NAMES).map((key) =>
          h(Bar, { key, name: NAMES[key], value: bars[key], color: COLORS[key] }),
        ),
        data && data.frozen ? h('p', { style: s.frozen }, '冻结中：时间不走，也不注入。') : null,
        data && data.preview
          ? h('div', { style: s.preview }, data.preview)
          : h('p', { style: s.note }, data ? '这一轮什么都没注入（麻醉或冻结）。' : '正在读…'),
        error ? h('p', { style: s.err }, error) : null,
        h('p', { style: s.note }, '状态在 ~/.dsh/feeling/state.json，开关在 config.json，流水在 feeling.log。'),
      )
    }

    function apply(ctx) {
      ctx.effect(() =>
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'feeling',
              order: 26,
              label: () => '情绪',
            },
            Panel,
          ),
        ),
      )
    }

    return {
      inject: ['slots'],
      apply,
    }
  },
})

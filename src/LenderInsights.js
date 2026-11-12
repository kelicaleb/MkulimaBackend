import express from 'express'
import { tenders } from './Tender.js'
import { users } from './User.js'

export const LenderInsights = express.Router()

const DAY = 1000 * 60 * 60 * 24

const toNumber = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

const startOfDay = (value) => {
    const date = new Date(value)
    date.setHours(0, 0, 0, 0)
    return date
}

const monthKey = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const loadTenderRows = async (lenderId) => {
    const rows = await tenders.findAll({
        where: { lender_id: lenderId },
        order: [['created_at', 'DESC']],
    })
    return rows.map((row) => row.get({ plain: true }))
}

const loadLender = async (lenderId) => {
    const lender = await users.findByPk(lenderId, {
        attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
    })
    return lender ? lender.get({ plain: true }) : null
}

const buildInsights = (rows, lender) => {
    const now = new Date()
    const today = startOfDay(now)
    const totalCommitted = rows.reduce((sum, row) => sum + toNumber(row.budget), 0)

    const categoryMap = new Map()
    const monthMap = new Map()
    const buckets = {
        overdue: { key: 'overdue', label: 'Overdue', count: 0, total: 0 },
        closing_soon: { key: 'closing_soon', label: 'Closing within 7 days', count: 0, total: 0 },
        this_month: { key: 'this_month', label: 'Due within 30 days', count: 0, total: 0 },
        later: { key: 'later', label: 'Beyond 30 days', count: 0, total: 0 },
    }

    const enriched = rows.map((row) => {
        const budget = toNumber(row.budget)
        const deadlineDate = row.deadline ? new Date(row.deadline) : null
        const validDeadline = deadlineDate instanceof Date && !Number.isNaN(deadlineDate.getTime())
        const daysRemaining = validDeadline
            ? Math.ceil((startOfDay(deadlineDate).getTime() - today.getTime()) / DAY)
            : null

        let urgency = 'later'
        if (daysRemaining !== null) {
            if (daysRemaining < 0) urgency = 'overdue'
            else if (daysRemaining <= 7) urgency = 'closing_soon'
            else if (daysRemaining <= 30) urgency = 'this_month'
        }

        const category = row.category || 'Uncategorised'
        const currentCategory = categoryMap.get(category) || { category, count: 0, total: 0 }
        currentCategory.count += 1
        currentCategory.total += budget
        categoryMap.set(category, currentCategory)

        const key = monthKey(row.created_at || now)
        if (key) {
            const currentMonth = monthMap.get(key) || { key, count: 0, total: 0 }
            currentMonth.count += 1
            currentMonth.total += budget
            monthMap.set(key, currentMonth)
        }

        if (buckets[urgency]) {
            buckets[urgency].count += 1
            buckets[urgency].total += budget
        }

        return {
            ...row,
            budget,
            days_remaining: daysRemaining,
            urgency,
            share: totalCommitted > 0 ? Number(((budget / totalCommitted) * 100).toFixed(2)) : 0,
        }
    })

    const byCategory = [...categoryMap.values()]
        .map((entry) => ({
            ...entry,
            average: entry.count > 0 ? Number((entry.total / entry.count).toFixed(2)) : 0,
            share: totalCommitted > 0 ? Number(((entry.total / totalCommitted) * 100).toFixed(2)) : 0,
        }))
        .sort((a, b) => b.total - a.total)

    const byMonth = [...monthMap.values()].sort((a, b) => a.key.localeCompare(b.key))

    const sortedByDeadline = enriched
        .filter((tender) => tender.days_remaining !== null)
        .sort((a, b) => a.days_remaining - b.days_remaining)
    const nextDeadline = sortedByDeadline.find((tender) => tender.days_remaining >= 0) || null
    const largest = [...enriched].sort((a, b) => b.budget - a.budget)[0] || null

    const overdue = enriched.filter((tender) => tender.urgency === 'overdue').length
    const closingSoon = enriched.filter((tender) => tender.urgency === 'closing_soon').length
    const active = enriched.length - overdue

    const insights = []
    if (enriched.length === 0) {
        insights.push({
            tone: 'neutral',
            title: 'No funded tenders yet',
            detail: 'Once you commit capital to a tender it will appear here with exposure, deadline and category analytics.',
        })
    } else {
        if (largest) {
            insights.push({
                tone: 'neutral',
                title: 'Largest single commitment',
                detail: `${largest.title} accounts for ${largest.share}% of committed capital.`,
            })
        }
        if (byCategory.length > 0) {
            const top = byCategory[0]
            insights.push({
                tone: top.share >= 60 ? 'warning' : 'positive',
                title: 'Sector concentration',
                detail: `${top.category} represents ${top.share}% of the portfolio across ${top.count} tender${top.count === 1 ? '' : 's'}.`,
            })
        }
        if (overdue > 0) {
            insights.push({
                tone: 'warning',
                title: 'Overdue exposure',
                detail: `${overdue} commitment${overdue === 1 ? ' is' : 's are'} past deadline. Review delivery before committing more capital.`,
            })
        } else if (closingSoon > 0) {
            insights.push({
                tone: 'warning',
                title: 'Deadlines approaching',
                detail: `${closingSoon} commitment${closingSoon === 1 ? '' : 's'} close within the next 7 days.`,
            })
        } else {
            insights.push({
                tone: 'positive',
                title: 'Deadlines under control',
                detail: 'No commitments are overdue and none close within the next 7 days.',
            })
        }
        if (byCategory.length > 1) {
            insights.push({
                tone: 'positive',
                title: 'Diversification',
                detail: `Capital is spread across ${byCategory.length} categories, reducing single-sector risk.`,
            })
        }
    }

    return {
        lender,
        generated_at: now.toISOString(),
        summary: {
            total_tenders: enriched.length,
            total_committed: Number(totalCommitted.toFixed(2)),
            average_ticket: enriched.length > 0 ? Number((totalCommitted / enriched.length).toFixed(2)) : 0,
            largest_ticket: largest ? largest.budget : 0,
            categories: byCategory.length,
            active,
            closing_soon: closingSoon,
            overdue,
            next_deadline: nextDeadline ? nextDeadline.deadline : null,
            next_deadline_title: nextDeadline ? nextDeadline.title : null,
            next_deadline_days: nextDeadline ? nextDeadline.days_remaining : null,
        },
        by_category: byCategory,
        by_month: byMonth,
        deadline_buckets: Object.values(buckets),
        tenders: enriched,
        insights,
    }
}

// Full lender portfolio report
LenderInsights.get('/lender/:lender_id', async (req, res) => {
    try {
        const { lender_id } = req.params
        const [rows, lender] = await Promise.all([loadTenderRows(lender_id), loadLender(lender_id)])
        return res.status(200).json(buildInsights(rows, lender))
    } catch (err) {
        console.error('Failed to build lender insights', err)
        return res.status(500).json({ message: 'Internal server error' })
    }
})

// Category + deadline allocation only
LenderInsights.get('/lender/:lender_id/categories', async (req, res) => {
    try {
        const rows = await loadTenderRows(req.params.lender_id)
        const report = buildInsights(rows, null)
        return res.status(200).json({
            by_category: report.by_category,
            deadline_buckets: report.deadline_buckets,
        })
    } catch (err) {
        console.error('Failed to build category insights', err)
        return res.status(500).json({ message: 'Internal server error' })
    }
})

// Month-by-month funding timeline only
LenderInsights.get('/lender/:lender_id/timeline', async (req, res) => {
    try {
        const rows = await loadTenderRows(req.params.lender_id)
        const report = buildInsights(rows, null)
        return res.status(200).json({ by_month: report.by_month, summary: report.summary })
    } catch (err) {
        console.error('Failed to build timeline insights', err)
        return res.status(500).json({ message: 'Internal server error' })
    }
})

LenderInsights.get('/health', (req, res) => {
    return res.status(200).json({ status: 'ok', service: 'lender-insights' })
})

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { ToastContainer, toast } from 'react-toastify'
import Sidebar from '../components/Sidebar.jsx'
import TopBar from '../components/TopBar.jsx'
import Footer from '../components/Footer.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import NewProjectModal from '../components/NewProjectModal.jsx'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal.jsx'
import PricingModal from '../components/payment/PricingModal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { getAllProject, toggleLike, deleteProject } from '../features/project.js'
import { animateHeroReveal } from '../utils/animations.js'
import { getUserSubscription } from '../features/payment'

const Homepage = () => {
    const navigate = useNavigate()
    const { userData } = useSelector((state) => state.user)
    const [projects, setProjects] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('projects') // 'projects' | 'starred'
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
    const [subscription, setSubscription] = useState(null)
    const [projectToDelete, setProjectToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
    const heroRef = useRef(null)

    // Local theme management: get & set from localStorage
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem('theme') || 'dark'
        } catch {
            return 'dark'
        }
    })

    const toggleTheme = () => {
        setTheme((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark'
            try {
                localStorage.setItem('theme', next)
            } catch (err) {
                console.error("Failed to save theme in localStorage:", err)
            }
            return next
        })
    }

    const isDark = theme === 'dark'

    // Extract first name for the welcome banner
    const firstName = useMemo(() => {
        if (!userData?.name) return 'Explorer'
        return userData.name.trim().split(' ')[0]
    }, [userData])

    // Fetch user's real projects on mount
    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true)
            try {
                const data = await getAllProject()
                if (Array.isArray(data)) {
                    setProjects(data)
                }
            } catch (err) {
                console.error("Failed to fetch projects:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchProjects()

        // Fetch user active subscription
        const fetchSub = async () => {
            try {
                const res = await getUserSubscription()
                if (res?.subscription) {
                    setSubscription(res.subscription)
                }
            } catch (err) {
                console.error("Failed to fetch subscription:", err)
            }
        }
        fetchSub()
    }, [])

    // Animate hero on ready
    useEffect(() => {
        if (!isLoading && heroRef.current) {
            animateHeroReveal(heroRef.current)
        }
    }, [isLoading])

    // Handle toggle like/star
    const handleToggleLike = async (projectId) => {
        try {
            const updated = await toggleLike(projectId)
            if (updated && updated._id) {
                setProjects((prev) =>
                    prev.map((p) => (p._id === updated._id ? updated : p))
                )
            } else {
                setProjects((prev) =>
                    prev.map((p) => (p._id === projectId ? { ...p, liked: !p.liked } : p))
                )
            }
        } catch (err) {
            console.error("Failed to toggle star:", err)
        }
    }

    const isPro = subscription?.status?.toUpperCase() === 'ACTIVE' &&
        (subscription?.planId === 'PRO_MONTHLY' || subscription?.planId === 'PRO_YEARLY')

    // Gated project creation check for Starter plan (max 5 projects)
    const handleOpenNewProject = () => {
        if (!isPro && totalProjectsCount >= 5) {
            toast.warn('Starter plan workspace capacity reached (maximum 5 projects). Upgrade to Pro for unlimited cloud workspaces!')
            setIsPricingModalOpen(true)
            return
        }
        setIsNewProjectModalOpen(true)
    }

    // Handle new project creation
    const handleProjectCreated = (newProject) => {
        if (newProject) {
            setProjects((prev) => [newProject, ...prev])
            toast.success(`Project "${newProject.name}" created successfully!`)
        }
    }

    // Open project in IDE workspace
    const handleOpenProject = (project) => {
        const id = project._id || project.id
        if (id) {
            navigate(`/project/${id}`)
        }
    }

    // Initiate delete confirmation
    const handleDeleteRequest = (project) => {
        setProjectToDelete(project)
    }

    // Confirm delete execution
    const handleDeleteConfirm = async () => {
        if (!projectToDelete) return
        const id = projectToDelete._id || projectToDelete.id
        setIsDeleting(true)
        try {
            await deleteProject(id)
            setProjects((prev) => prev.filter((p) => (p._id || p.id) !== id))
            toast.success(`Project "${projectToDelete.name}" deleted successfully`)
            setProjectToDelete(null)
        } catch (err) {
            console.error("Failed to delete project:", err)
            toast.error(err.response?.data?.message || err.message || "Failed to delete project")
        } finally {
            setIsDeleting(false)
        }
    }

    // Filter projects based on search query
    const filteredProjects = useMemo(() => {
        if (!searchQuery.trim()) return projects
        const q = searchQuery.toLowerCase()
        return projects.filter((p) => {
            const nameMatch = p.name?.toLowerCase().includes(q)
            const descMatch = p.description?.toLowerCase().includes(q)
            const tagsMatch = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q))
            return nameMatch || descMatch || tagsMatch
        })
    }, [projects, searchQuery])

    // Starred vs regular projects
    const starredProjects = useMemo(() => {
        return filteredProjects.filter((p) => Boolean(p.liked))
    }, [filteredProjects])

    const regularProjects = useMemo(() => {
        return filteredProjects.filter((p) => !p.liked)
    }, [filteredProjects])

    // Overall total counts (unfiltered by search for sidebar badges)
    const totalProjectsCount = projects.length
    const starredProjectsCount = useMemo(() => {
        return projects.filter((p) => Boolean(p.liked)).length
    }, [projects])

    // Determine if empty state should be shown for the current tab
    const showEmptyState = activeTab === 'starred'
        ? starredProjects.length === 0
        : filteredProjects.length === 0

    return (
        <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-200 overflow-x-hidden ${
            isDark 
                ? 'bg-[#07090e] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200' 
                : 'bg-[#f5f2eb] text-[#201d1a] selection:bg-amber-100 selection:text-amber-900'
        }`}>
            {/* Upper Workspace: Sidebar on left + Projects workspace on right */}
            <div className="flex-1 flex w-full relative">
                {/* Left Sidebar */}
                <Sidebar
                    user={userData}
                    subscription={subscription}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    totalProjectsCount={totalProjectsCount}
                    starredProjectsCount={starredProjectsCount}
                    theme={theme}
                    isMobileOpen={isMobileSidebarOpen}
                    onCloseMobile={() => setIsMobileSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {/* Ambient Cyber Lighting / Radial Glow */}
                    <div 
                        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
                        style={{
                            opacity: isDark ? 0.45 : 0.35,
                            background: isDark
                                ? 'radial-gradient(ellipse 65% 55% at 50% 20%, rgba(22, 40, 72, 0.45) 0%, rgba(12, 18, 30, 0.3) 40%, rgba(7, 9, 14, 0.98) 75%)'
                                : 'radial-gradient(ellipse 65% 55% at 50% 15%, rgba(226, 232, 240, 0.7) 0%, rgba(241, 245, 249, 0.3) 50%, transparent 80%)'
                        }}
                    />

                    {/* Subtle tech grid */}
                    <div 
                        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
                        style={{
                            backgroundImage: isDark
                                ? 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)'
                                : 'linear-gradient(to right, #000000 1px, transparent 1px), linear-gradient(to bottom, #000000 1px, transparent 1px)',
                            backgroundSize: '48px 48px'
                        }}
                    />

                    {/* Top Bar with Search, Theme Toggle, & New Project Action */}
                    <TopBar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        subscription={subscription}
                        onOpenNewProject={handleOpenNewProject}
                        onOpenPricing={() => navigate('/payment')}
                        theme={theme}
                        toggleTheme={toggleTheme}
                        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
                    />

                    {/* Dashboard Scrollable Body */}
                    <main className="relative z-10 flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto space-y-8 sm:space-y-10">
                        {/* Welcome Back Hero */}
                        <div ref={heroRef} className="flex items-center justify-between">
                            <div>
                                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${
                                    isDark ? 'text-white' : 'text-slate-900'
                                }`}>
                                    Welcome Back, <span>{firstName}</span>
                                </h1>
                                <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                                    isDark ? 'text-slate-400' : 'text-slate-600'
                                }`}>
                                    Select a cloud workspace to resume building or create a new project.
                                </p>
                            </div>
                        </div>

                    {/* Loading Skeleton */}
                    {isLoading ? (
                        <div className="space-y-8 animate-pulse">
                            <div>
                                <div className={`h-5 w-44 rounded-lg mb-4 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className={`h-48 rounded-2xl border ${
                                            isDark ? 'bg-[#10131c] border-white/[0.06]' : 'bg-[#ebe5d8] border-[#d8d0bf] shadow-xs'
                                        }`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : showEmptyState ? (
                        /* Empty State */
                        <EmptyState
                            type={activeTab}
                            searchQuery={searchQuery}
                            onOpenNewProject={handleOpenNewProject}
                            theme={theme}
                        />
                    ) : (
                        <>
                            {/* Starred Projects Section */}
                            {(activeTab === 'projects' || activeTab === 'starred') && starredProjects.length > 0 && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <h2 className={`text-base sm:text-lg font-semibold tracking-tight ${
                                                isDark ? 'text-slate-100' : 'text-slate-900'
                                            }`}>
                                                Starred Projects
                                            </h2>
                                            <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md ${
                                                isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {starredProjects.length}
                                            </span>
                                        </div>

                                        <button 
                                            onClick={() => setActiveTab(activeTab === 'starred' ? 'projects' : 'starred')}
                                            className={`text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                                                isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                        >
                                            {activeTab === 'starred' ? 'Show all' : 'View all'}
                                        </button>
                                    </div>

                                    {/* Starred Grid */}
                                    <motion.div 
                                        layout
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                                    >
                                        <AnimatePresence>
                                            {starredProjects.map((project) => (
                                                <ProjectCard
                                                    key={project._id || project.id}
                                                    project={project}
                                                    onToggleLike={handleToggleLike}
                                                    onDelete={handleDeleteRequest}
                                                    onClick={handleOpenProject}
                                                    theme={theme}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                </section>
                            )}

                            {/* Regular Projects Section (Shown if activeTab is 'projects') */}
                            {activeTab === 'projects' && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <h2 className={`text-base sm:text-lg font-semibold tracking-tight ${
                                                isDark ? 'text-slate-100' : 'text-slate-900'
                                            }`}>
                                                Projects
                                            </h2>
                                            <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md ${
                                                isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {regularProjects.length}
                                            </span>
                                        </div>

                                        {regularProjects.length > 0 && (
                                            <button 
                                                onClick={() => setActiveTab('projects')}
                                                className={`text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                                                    isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-500 hover:text-slate-900'
                                                }`}
                                            >
                                                View all
                                            </button>
                                        )}
                                    </div>

                                    {regularProjects.length === 0 && starredProjects.length > 0 ? (
                                        <div className={`p-7 text-center text-xs sm:text-sm border rounded-2xl font-mono ${
                                            isDark 
                                                ? 'text-slate-400 border-white/[0.06] bg-[#10131c]/40' 
                                                : 'text-[#5e584f] border-[#d8d0bf] bg-[#ebe5d8]/60'
                                        }`}>
                                            All current projects are marked as Starred.
                                        </div>
                                    ) : (
                                        /* Projects Grid */
                                        <motion.div 
                                            layout
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                                        >
                                            <AnimatePresence>
                                                {regularProjects.map((project) => (
                                                    <ProjectCard
                                                        key={project._id || project.id}
                                                        project={project}
                                                        onToggleLike={handleToggleLike}
                                                        onDelete={handleDeleteRequest}
                                                        onClick={handleOpenProject}
                                                        theme={theme}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </motion.div>
                                    )}
                                </section>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>

        {/* Full-width Footer spanning 100% of the screen across the bottom */}
        <Footer theme={theme} />

            {/* Modal for Creating New Project */}
            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
                onProjectCreated={handleProjectCreated}
                onOpenPricing={() => {
                    setIsNewProjectModalOpen(false)
                    setIsPricingModalOpen(true)
                }}
                theme={theme}
            />

            {/* Modal for Confirming Project Deletion */}
            <DeleteConfirmationModal
                isOpen={Boolean(projectToDelete)}
                project={projectToDelete}
                onClose={() => !isDeleting && setProjectToDelete(null)}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                theme={theme}
            />

            {/* Modal for Pricing & Upgrades */}
            <PricingModal
                isOpen={isPricingModalOpen}
                onClose={() => setIsPricingModalOpen(false)}
                user={userData}
                onSubscriptionUpdated={(newSub) => setSubscription(newSub)}
            />

            {/* Bottom-right Toast Notifications */}
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={isDark ? 'dark' : 'light'}
            />
        </div>
    )
}

export default Homepage

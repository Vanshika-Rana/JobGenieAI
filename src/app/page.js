"use client";
import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
	ArrowUpIcon,
	BriefcaseIcon,
	DocumentTextIcon,
	LocationMarkerIcon,
	SparklesIcon,
	TagIcon,
	UserCircleIcon,
} from "@heroicons/react/outline";
import Link from "next/link";

export default function Home() {
	const [resume, setResume] = useState(null);
	const [jobs, setJobs] = useState([]);
	const [skills, setSkills] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [locations, setLocations] = useState("");
	const [workFromHome, setWorkFromHome] = useState(false);
	const [resumeText, setResumeText] = useState("");
	const [jobFitResults, setJobFitResults] = useState({});
	const [activeTabIndex, setActiveTabIndex] = useState(0);

	const handleFileChange = (e) => {
		setResume(e.target.files[0]);
		setError(null);
	};

	const handleSubmit = async () => {
		if (!resume) {
			alert("❌ Please upload a resume first!");
			return;
		}

		const formData = new FormData();
		formData.append("file", resume);
		formData.append("locations", locations);
		formData.append("workFromHome", workFromHome);

		setLoading(true);
		setError(null);

		try {
			const response = await axios.post("/api/upload", formData);

			if (
				!response.data ||
				!response.data.jobResults ||
				!response.data.suggestedRoles ||
				!response.data.markdownText
			) {
				throw new Error("Invalid response from server");
			}

			const formattedJobs = Object.entries(response.data.jobResults).map(
				([role, jobs]) => ({
					role,
					jobs: jobs || [],
				})
			);

			setJobs(formattedJobs);
			setSkills(response.data.suggestedRoles || []);
			setResumeText(response.data.markdownText);
			setActiveTabIndex(1);
		} catch (error) {
			setError("Failed to fetch job recommendations. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleCheckFit = async (jobId, jobDescription) => {
		if (!resumeText) {
			alert("Resume text not available for comparison.");
			return;
		}

		setJobFitResults((prev) => ({ ...prev, [jobId]: "Loading..." }));

		try {
			const response = await axios.get(
				`/api/upload?resumeText=${encodeURIComponent(
					resumeText
				)}&jobDescription=${encodeURIComponent(jobDescription)}`
			);

			setJobFitResults((prev) => ({
				...prev,
				[jobId]: {
					suitability: response.data.suitability,
					improvements: response.data.improvements,
					coverLetterSuggestions:
						response.data.coverLetterSuggestions,
				},
			}));
		} catch (error) {
			setJobFitResults((prev) => ({
				...prev,
				[jobId]: "Error fetching fit analysis.",
			}));
		}
	};

	const tabs = [
		{ name: "Upload", icon: <DocumentTextIcon className='h-5 w-5' /> },
		{ name: "Recommendations", icon: <SparklesIcon className='h-5 w-5' /> },
	];

	return (
		<div className='min-h-screen bg-[#080C18] text-white font-sans'>
			<div className='fixed inset-0 -z-10 overflow-hidden'>
				<div className='absolute top-0 left-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob'></div>
				<div className='absolute top-40 right-20 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-2000'></div>
				<div className='absolute bottom-20 left-20 w-80 h-80 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-4000'></div>
			</div>

			<header className='relative z-10'>
				<div className='max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8'>
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className='flex items-center justify-between flex-wrap'>
						<div className='flex items-center mb-4 sm:mb-0'>
							<div className='bg-indigo-600 p-3 rounded-2xl mr-4'>
								<BriefcaseIcon className='h-8 w-8 text-white' />
							</div>
							<div>
								<h1 className='text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600'>
									Job Genie AI
								</h1>
								<p className='text-indigo-200 text-sm'>
									Making Job Search a Breeze ✨
								</p>
							</div>
						</div>

						<div className='hidden md:flex bg-[#111827] rounded-full p-1'>
							{tabs.map((tab, idx) => (
								<button
									key={tab.name}
									onClick={() => setActiveTabIndex(idx)}
									className={`${
										activeTabIndex === idx
											? "bg-indigo-600 text-white"
											: "text-gray-400 hover:text-gray-200"
									} flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200`}>
									{tab.icon}
									<span className='ml-2'>{tab.name}</span>
								</button>
							))}
						</div>
					</motion.div>
				</div>
			</header>

			<main className='max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10'>
				<div className='w-full flex justify-center my-4'>
					<a
						href='https://buymeacoffee.com/aahiknsv'
						target='_blank'
						rel='noopener noreferrer'
						className='px-4 py-2 text-sm font-medium rounded-full border border-gray-500 hover:border-yellow-400 text-gray-300 hover:text-yellow-300 transition flex items-center space-x-2'>
						Little support to keep this app free ♥️
					</a>
				</div>
				{activeTabIndex === 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className='flex flex-col items-center'>
						<div className='w-full max-w-md'>
							<div className='bg-[#111827] bg-opacity-80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-gray-800'>
								<h2 className='text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500'>
									Job Genie is here to help!
								</h2>

								<div className='space-y-6'>
									<div>
										<label className='block text-sm font-medium text-indigo-300 mb-2'>
											Upload Resume
											<span className='text-pink-500 ml-1'>
												*
											</span>
										</label>
										<label className='flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:border-indigo-500 transition-colors bg-[#0D1425] group'>
											<input
												type='file'
												onChange={handleFileChange}
												className='hidden'
											/>
											<div className='text-center py-6 px-2'>
												<div className='w-12 h-12 mx-auto mb-3 bg-[#1A2435] rounded-full flex items-center justify-center group-hover:bg-indigo-900 transition-colors'>
													<DocumentTextIcon className='h-6 w-6 text-indigo-400 group-hover:text-indigo-200' />
												</div>
												<p className='text-sm text-gray-400 group-hover:text-indigo-300 transition-colors'>
													{resume
														? resume.name
														: "Drag & drop or click to upload PDF/DOCX"}
												</p>
											</div>
										</label>
									</div>

									<div>
										<label className=' text-sm font-medium text-indigo-300 mb-2 flex items-center'>
											<LocationMarkerIcon className='h-4 w-4 mr-1 text-indigo-400' />
											Preferred Locations
										</label>
										<div className='relative'>
											<input
												type='text'
												placeholder='e.g. New York, London, Remote'
												value={locations}
												onChange={(e) =>
													setLocations(e.target.value)
												}
												className='block w-full rounded-xl bg-[#0D1425] border-gray-700 text-gray-300 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 text-sm'
											/>
										</div>
									</div>

									<div className='flex items-center'>
										<div className='relative'>
											<input
												type='checkbox'
												checked={workFromHome}
												onChange={() =>
													setWorkFromHome(
														!workFromHome
													)
												}
												className='h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded-md bg-[#0D1425]'
											/>
											<div
												className={`absolute inset-0 rounded-md ${
													workFromHome
														? "bg-indigo-600 border-2 border-indigo-400"
														: "border border-gray-700"
												} pointer-events-none transition-colors duration-200`}></div>
											{workFromHome && (
												<svg
													className='absolute inset-0 h-full w-full text-white pointer-events-none'
													fill='none'
													viewBox='0 0 24 24'
													stroke='currentColor'>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M5 13l4 4L19 7'
													/>
												</svg>
											)}
										</div>
										<label className='ml-3 block text-sm text-gray-300'>
											Include Remote Jobs
										</label>
									</div>

									<button
										onClick={handleSubmit}
										disabled={loading}
										className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
											loading
												? "bg-gray-700 cursor-not-allowed"
												: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg hover:shadow-indigo-600/20"
										}`}>
										{loading ? (
											<>
												<svg
													className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
													xmlns='http://www.w3.org/2000/svg'
													fill='none'
													viewBox='0 0 24 24'>
													<circle
														className='opacity-25'
														cx='12'
														cy='12'
														r='10'
														stroke='currentColor'
														strokeWidth='4'></circle>
													<path
														className='opacity-75'
														fill='currentColor'
														d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
												</svg>
												Working Magic...
											</>
										) : (
											<>
												<SparklesIcon className='h-5 w-5 mr-2' />
												Find My Dream Job
											</>
										)}
									</button>

									{error && (
										<motion.div
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											className='mt-4 p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-200 text-sm'>
											{error}
										</motion.div>
									)}
								</div>
							</div>

							<div className='mt-8 text-center text-gray-500 text-sm'>
								<p className='font-bold'>
									Made with ♥️ by Vanshika
								</p>
								<p className='mt-2 font-bold '>
									<a
										href='https://buymeacoffee.com/aahiknsv'
										target='_blank'
										className='text-yellow-400'>
										Buy Me a ☕️
									</a>{" "}
									•{" "}
									<a
										className='text-gray-200'
										href='http://twitter.com/aahiknsv'
										target='_blank'>
										Twitter / X
									</a>{" "}
									•{" "}
									<a
										className='text-blue-400'
										href='https://www.linkedin.com/in/vanshikarana/'
										target='_blank'>
										LinkedIn
									</a>
								</p>
							</div>
						</div>
					</motion.div>
				)}

				{activeTabIndex === 1 && (
					<div className='space-y-8'>
						{loading ? (
							<div className='flex flex-col items-center justify-center py-12'>
								<div className='w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin'></div>
								<p className='mt-4 text-indigo-300 font-medium'>
									AI is analyzing your resume...
								</p>
								<p className='text-gray-500 text-sm mt-2'>
									This might take a moment
								</p>
							</div>
						) : Array.isArray(jobs) && jobs.length > 0 ? (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.5, delay: 0.2 }}
								className='space-y-6'>
								<div className='flex items-center justify-between flex-wrap'>
									<h2 className='text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500'>
										AI-Powered Recommendations
									</h2>
									<button
										onClick={() => setActiveTabIndex(0)}
										className='flex items-center text-indigo-400 hover:text-indigo-300 text-sm font-medium mt-4 sm:mt-0'>
										<ArrowUpIcon className='h-4 w-4 mr-1' />
										Upload Another Resume
									</button>
								</div>

								{jobs.map((jobCategory, index) => (
									<motion.div
										key={index}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											duration: 0.3,
											delay: index * 0.1,
										}}
										className='bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl'>
										<div className='px-6 py-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-sm border-b border-gray-800'>
											<h3 className='text-lg font-semibold text-indigo-300 flex items-center'>
												<TagIcon className='h-5 w-5 mr-2 text-indigo-400' />
												{jobCategory.role}
											</h3>
										</div>
										<div className='p-6 space-y-4'>
											{jobCategory.jobs.map(
												(job, jobIndex) => (
													<div
														key={jobIndex}
														className='border border-gray-800 hover:border-indigo-800 bg-[#0D1425] rounded-xl p-5 transition-all duration-300 group hover:shadow-lg hover:shadow-indigo-900/20'>
														<div className='flex justify-between items-start flex-wrap'>
															<div>
																<h3 className='text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors'>
																	{job.title}
																</h3>
																<p className='text-sm text-gray-400 mt-1 flex items-center'>
																	<UserCircleIcon className='h-4 w-4 mr-1 text-gray-500' />
																	{
																		job.company
																	}
																	<span className='mx-2'>
																		•
																	</span>
																	<LocationMarkerIcon className='h-4 w-4 mr-1 text-gray-500' />
																	{
																		job.location
																	}
																</p>
															</div>

															<div className='flex items-center justify-between mt-3 flex-wrap gap-2'>
																{job.apply_links
																	.length >
																	0 && (
																	<a
																		href={
																			job
																				.apply_links[0]
																				.link
																		}
																		target='_blank'
																		rel='noopener noreferrer'
																		className='px-4 py-2 mr-4 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium hover:from-green-400 hover:to-teal-400 transition-all shadow-lg flex items-center'>
																		Apply
																		Now
																		<ArrowUpIcon className='h-4 w-4 ml-2 transform rotate-45' />
																	</a>
																)}
																<button
																	onClick={() =>
																		handleCheckFit(
																			job.job_url,
																			job.description
																		)
																	}
																	className='px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md flex items-center'>
																	<SparklesIcon className='h-4 w-4 mr-1' />
																	Check Match
																</button>
															</div>
														</div>

														{jobFitResults[
															job.job_url
														] &&
															typeof jobFitResults[
																job.job_url
															] === "object" && (
																<motion.div
																	initial={{
																		opacity: 0,
																		height: 0,
																	}}
																	animate={{
																		opacity: 1,
																		height: "auto",
																	}}
																	transition={{
																		duration: 0.3,
																	}}
																	className='mt-4 border-t border-gray-800 pt-4'>
																	<div className='mb-3'>
																		<div className='flex items-center justify-between mb-1'>
																			<span className='text-sm text-gray-400'>
																				Match
																				Score
																			</span>
																			<span className='text-sm font-medium text-indigo-300'>
																				{
																					jobFitResults[
																						job
																							.job_url
																					]
																						.suitability
																				}
																			</span>
																		</div>
																		<div className='w-full bg-gray-800 rounded-full h-2'>
																			<div
																				className='bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full'
																				style={{
																					width: `${
																						jobFitResults[
																							job
																								.job_url
																						]
																							.suitability
																					}%`,
																				}}></div>
																		</div>
																	</div>

																	<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
																		<div className='bg-[#161F32] rounded-lg p-3'>
																			<h4 className='text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-2'>
																				Improvements
																			</h4>
																			<ul className='space-y-1 text-sm text-gray-300'>
																				{jobFitResults[
																					job
																						.job_url
																				].improvements.map(
																					(
																						item,
																						i
																					) => (
																						<li
																							key={
																								i
																							}
																							className='flex'>
																							<span className='text-indigo-500 mr-2'>
																								•
																							</span>
																							<span>
																								{
																									item
																								}
																							</span>
																						</li>
																					)
																				)}
																			</ul>
																		</div>

																		<div className='bg-[#161F32] rounded-lg p-3'>
																			<h4 className='text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-2'>
																				Cover
																				Letter
																				Tips
																			</h4>
																			<ul className='space-y-1 text-sm text-gray-300'>
																				{jobFitResults[
																					job
																						.job_url
																				].coverLetterSuggestions.map(
																					(
																						item,
																						i
																					) => (
																						<li
																							key={
																								i
																							}
																							className='flex'>
																							<span className='text-indigo-500 mr-2'>
																								•
																							</span>
																							<span>
																								{
																									item
																								}
																							</span>
																						</li>
																					)
																				)}
																			</ul>
																		</div>
																	</div>
																</motion.div>
															)}

														{jobFitResults[
															job.job_url
														] &&
															typeof jobFitResults[
																job.job_url
															] === "string" && (
																<p className='mt-3 text-sm text-gray-400'>
																	{
																		jobFitResults[
																			job
																				.job_url
																		]
																	}
																</p>
															)}
													</div>
												)
											)}
										</div>
									</motion.div>
								))}
							</motion.div>
						) : (
							<div className='flex flex-col items-center justify-center py-16 text-center'>
								<div className='w-20 h-20 bg-[#111827] rounded-full flex items-center justify-center mb-4'>
									<SparklesIcon className='h-10 w-10 text-indigo-400' />
								</div>
								<h3 className='text-xl font-medium text-gray-200 mb-2'>
									No Recommendations Yet
								</h3>
								<p className='text-gray-500 max-w-md mb-6'>
									Upload your resume and let our AI find your
									perfect career match
								</p>
								<button
									onClick={() => setActiveTabIndex(0)}
									className='px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors'>
									Get Started
								</button>
							</div>
						)}
					</div>
				)}
			</main>

			<div className='md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0E1A]/90 backdrop-blur-lg border-t border-gray-800 z-20'>
				<div className='flex items-center justify-around'>
					{tabs.map((tab, idx) => (
						<button
							key={tab.name}
							onClick={() => setActiveTabIndex(idx)}
							className={`flex flex-col items-center py-3 px-5 ${
								activeTabIndex === idx
									? "text-indigo-400"
									: "text-gray-500"
							}`}>
							<div
								className={`p-1.5 rounded-full mb-1 ${
									activeTabIndex === idx
										? "bg-indigo-900/30"
										: ""
								}`}>
								{tab.icon}
							</div>
							<span className='text-xs'>{tab.name}</span>
						</button>
					))}
				</div>
			</div>

			<style jsx>{`
				@keyframes blob {
					0% {
						transform: translate(0px, 0px) scale(1);
					}
					33% {
						transform: translate(30px, -50px) scale(1.1);
					}
					66% {
						transform: translate(-20px, 20px) scale(0.9);
					}
					100% {
						transform: translate(0px, 0px) scale(1);
					}
				}
				.animate-blob {
					animation: blob 7s infinite;
				}
				.animation-delay-2000 {
					animation-delay: 2s;
				}
				.animation-delay-4000 {
					animation-delay: 4s;
				}
			`}</style>
		</div>
	);
}

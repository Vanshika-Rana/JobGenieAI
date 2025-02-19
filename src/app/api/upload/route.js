import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { LlamaParseReader } from "llamaindex";
import "dotenv/config";
import axios from "axios";
import path from "path";
import os from "os";

async function parsePDF(fileBuffer) {
	if (!process.env.LLAMA_CLOUD_API_KEY) {
		throw new Error("LlamaParse API Key is missing.");
	}

	const tempFilePath = path.join(os.tmpdir(), `resume-${Date.now()}.pdf`);
	await writeFile(tempFilePath, Buffer.from(fileBuffer));

	const reader = new LlamaParseReader({
		apiKey: process.env.LLAMA_CLOUD_API_KEY,
		resultType: "markdown",
	});

	const documents = await reader.loadData(tempFilePath);
	const markdownText = documents[0]?.text || "";

	const markdownPath = path.join(os.tmpdir(), `resume.md`);
	await writeFile(markdownPath, markdownText);

	await unlink(tempFilePath);

	return { markdownText, markdownPath };
}

async function analyzeResume(markdown) {
	if (!process.env.OPENAI_API_KEY) {
		throw new Error("OpenAI API Key is missing.");
	}

	const response = await axios.post(
		"https://api.openai.com/v1/chat/completions",
		{
			model: "gpt-4",
			messages: [
				{
					role: "user",
					content: `You are a career expert with extensive experience in resume analysis. Analyze the following resume and suggest 3-4 job roles. Provide only a comma-separated list of job roles without any additional text.
					
					Example Response: Front End Developer, Full Stack Developer, UI/UX Designer, Angular Developer

					${markdown}`,
				},
			],
		},
		{ headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
	);

	return (
		response.data.choices[0]?.message?.content
			?.split(",")
			.map((role) => role.trim())
			.filter((role) => role.length > 0) || []
	);
}

async function fetchJobsForRoles(jobRoles, locations, workFromHome) {
	if (!process.env.SERP_API_KEY) {
		throw new Error("SerpApi Key is missing.");
	}

	let jobResults = {};

	for (const role of jobRoles) {
		jobResults[role] = [];

		for (const location of locations) {
			const serpApiUrl = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(
				role + " " + location
			)}&hl=en${workFromHome ? "&ltype=1" : ""}&api_key=${
				process.env.SERP_API_KEY
			}`;

			try {
				const response = await axios.get(serpApiUrl);

				jobResults[role].push(
					...(response.data.jobs_results?.map((job) => ({
						title: job.title,
						company: job.company_name,
						location: job.location,
						posted_at: job.detected_extensions?.posted_at || "Unknown",
						salary: job.detected_extensions?.salary || "Not mentioned",
						description: job.description || "No description available.",
						apply_links: job.apply_options?.map((option) => ({
							platform: option.title,
							link: option.link,
						})) || [],
						job_url: job.share_link,
					})) || [])
				);
			} catch (error) {
				console.error(
					`Error fetching jobs for ${role} in ${location}:`,
					error.message
				);
			}
		}
	}

	return jobResults;
}

async function checkJobFit(resumeText, jobDescription) {
	if (!process.env.OPENAI_API_KEY) {
		throw new Error("OpenAI API Key is missing.");
	}

	const response = await axios.post(
		"https://api.openai.com/v1/chat/completions",
		{
			model: "gpt-4",
			messages: [
				{
					role: "user",
					content: `Compare the following resume with the given job description. Provide a suitability percentage and specific areas for improvement.

					### **Response Format**
					{"suitability": "85%", "improvements": ["Gain experience in React.js", "Enhance project management skills"], "coverLetterSuggestions": ["Highlight JavaScript expertise", "Mention leadership experience"]}

					### **Resume**
					${resumeText}

					### **Job Description**
					${jobDescription}`,
				},
			],
		},
		{ headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
	);

	return JSON.parse(response.data.choices[0]?.message?.content || "{}");
}

export async function POST(req) {
	const formData = await req.formData();
	const fileBuffer = Buffer.from(await formData.get("file").arrayBuffer());
	const locations =
		formData
			.get("locations")
			?.split(",")
			.map((loc) => loc.trim()) || [];
	const workFromHome = formData.get("workFromHome") === "true";

	const { markdownText, markdownPath } = await parsePDF(fileBuffer);
	const suggestedRoles = await analyzeResume(markdownText);
	const jobResults = await fetchJobsForRoles(
		suggestedRoles,
		locations,
		workFromHome
	);


	return NextResponse.json({ suggestedRoles, jobResults, markdownText });
}

export async function GET(req) {
	const { searchParams } = new URL(req.url);
	const resumeText = searchParams.get("resumeText");
	const jobDescription = searchParams.get("jobDescription");

	if (!resumeText || !jobDescription) {
		return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
	}

	const fitResult = await checkJobFit(resumeText, jobDescription);
	return NextResponse.json(fitResult);
}
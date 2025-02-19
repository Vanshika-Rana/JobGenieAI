import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { LlamaParseReader } from "llamaindex";
import "dotenv/config";
import axios from "axios";
import path from "path";
import os from "os";


async function parsePDF(fileBuffer) {
	try {
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
		await unlink(tempFilePath); 

		return documents[0]?.text || "";
	} catch (error) {
		console.error("Error parsing PDF:", error.message);
		throw new Error("Failed to process resume.");
	}
}


async function analyzeResume(markdown) {
	try {
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
						content: `You are a career expert. Analyze this resume and return 3-4 job roles (comma-separated).
						Example: Front End Developer, Full Stack Developer, UI/UX Designer, Angular Developer

						### Resume
						${markdown}`,
					},
				],
			},
			{ headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
		);

		return response.data.choices[0]?.message?.content
			?.split(",")
			.map((role) => role.trim())
			.filter((role) => role.length > 0) || [];
	} catch (error) {
		console.error("Error analyzing resume:", error.message);
		throw new Error("Failed to analyze resume.");
	}
}


async function fetchJobsForRoles(jobRoles, locations, workFromHome) {
	if (!process.env.SERP_API_KEY) {
		throw new Error("SerpApi Key is missing.");
	}

	try {
		const fetchJobPromises = jobRoles.map(async (role) => {
			const roleJobs = [];

			await Promise.all(
				locations.map(async (location) => {
					const serpApiUrl = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(
						`${role} ${location}`
					)}&hl=en${workFromHome ? "&ltype=1" : ""}&api_key=${process.env.SERP_API_KEY}`;

					const response = await axios.get(serpApiUrl);
					const jobs = response.data.jobs_results?.map((job) => ({
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
					})) || [];

					roleJobs.push(...jobs);
				})
			);

			return { [role]: roleJobs };
		});

		const resultsArray = await Promise.all(fetchJobPromises);
		return Object.assign({}, ...resultsArray);
	} catch (error) {
		console.error("Error fetching job listings:", error.message);
		throw new Error("Failed to fetch job listings.");
	}
}


async function checkJobFit(resumeText, jobDescription) {
	try {
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
						content: `Analyze this resume against the job description and return a JSON response.
						
						### Response Format
						{"suitability": "85%", "improvements": ["Gain experience in React.js"], "coverLetterSuggestions": ["Highlight JavaScript expertise"]}

						### Resume
						${resumeText}

						### Job Description
						${jobDescription}`,
					},
				],
			},
			{ headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
		);

		return JSON.parse(response.data.choices[0]?.message?.content || "{}");
	} catch (error) {
		console.error("Error analyzing job fit:", error.message);
		throw new Error("Failed to analyze job fit.");
	}
}


export async function POST(req) {
	try {
		const formData = await req.formData();
		const fileBuffer = Buffer.from(await formData.get("file").arrayBuffer());
		const locations = formData.get("locations")?.split(",").map((loc) => loc.trim()) || [];
		const workFromHome = formData.get("workFromHome") === "true";

		const markdownText = await parsePDF(fileBuffer);
		const suggestedRoles = await analyzeResume(markdownText);
		const jobResults = await fetchJobsForRoles(suggestedRoles, locations, workFromHome);

		return NextResponse.json({ suggestedRoles, jobResults, markdownText });
	} catch (error) {
		console.error("Error handling request:", error.message);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}


export async function GET(req) {
	try {
		const { searchParams } = new URL(req.url);
		const resumeText = searchParams.get("resumeText");
		const jobDescription = searchParams.get("jobDescription");

		if (!resumeText || !jobDescription) {
			return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
		}

		const fitResult = await checkJobFit(resumeText, jobDescription);
		return NextResponse.json(fitResult);
	} catch (error) {
		console.error("Error analyzing job fit:", error.message);
		return NextResponse.json({ error: "Failed to analyze job fit." }, { status: 500 });
	}
}